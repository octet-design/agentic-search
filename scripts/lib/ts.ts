/** Typesense helpers shared by offline scripts (discover, build-taxonomy). */
import { getTypesense, productsCollection } from "../../src/lib/typesense";

const MULTI_SEARCH_CHUNK = 40;

export type Params = Record<string, string | number | boolean>;
export type FacetCount = {
  field_name: string;
  counts: { value: string; count: number }[];
  stats?: { min?: number; max?: number; avg?: number; sum?: number; total_values?: number };
};
export type Hit = {
  document: Record<string, unknown>;
  text_match?: number;
  vector_distance?: number;
  hybrid_search_info?: unknown;
  text_match_info?: unknown;
};
export type SearchResult = {
  found: number;
  search_time_ms: number;
  hits?: Hit[];
  facet_counts?: FacetCount[];
  error?: string;
  code?: number;
};

function collection() {
  return getTypesense().collections(productsCollection()).documents();
}

export async function search(params: Params): Promise<SearchResult> {
  const res = await collection().search({ q: "*", query_by: "title", ...params } as never);
  return res as unknown as SearchResult;
}

/**
 * Runs many searches via multi_search (POST), chunked, preserving order. Throws on per-search errors.
 * Lower `chunkSize` for heavy searches (long filters) so one request stays under the 10s client timeout.
 */
export async function multiSearch(searches: Params[], chunkSize = MULTI_SEARCH_CHUNK): Promise<SearchResult[]> {
  const out: SearchResult[] = [];
  for (let i = 0; i < searches.length; i += chunkSize) {
    const chunk = searches.slice(i, i + chunkSize).map((s) => ({
      collection: productsCollection(),
      q: "*",
      query_by: "title",
      ...s,
    }));
    const res = (await getTypesense().multiSearch.perform({ searches: chunk } as never)) as unknown as {
      results: SearchResult[];
    };
    for (const r of res.results) {
      if (r.error) throw new Error(`multi_search error ${r.code ?? ""}: ${r.error}`);
      out.push(r);
    }
  }
  return out;
}

/** Runs searches individually with limited concurrency (deep pages are too slow to batch). */
export async function searchMany(searches: Params[], concurrency = 5): Promise<SearchResult[]> {
  const out: SearchResult[] = new Array(searches.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(concurrency, searches.length) }, async () => {
      while (next < searches.length) {
        const i = next++;
        out[i] = await search(searches[i]);
      }
    }),
  );
  return out;
}

export const esc = (v: string) => "`" + v.replace(/`/g, "\\`") + "`";
export const and = (...parts: (string | undefined)[]) => parts.filter(Boolean).join(" && ");

export async function count(filter?: string): Promise<number> {
  const r = await search({ per_page: 0, ...(filter ? { filter_by: filter } : {}) });
  return r.found;
}

export type PriceGroup = { name: string; filter?: string };
export type PriceGroupStats = {
  name: string;
  count: number;
  min: number | null;
  max: number | null;
  /** percentile (e.g. 0.25) → ₹ value, rounded */
  percentiles: Map<number, number>;
};

/** Enough for every distinct price in the catalog (~15k within one gender). */
const MAX_PRICE_FACET_VALUES = 200_000;

/**
 * Exact price percentiles per group. `price` is a facet, so faceting on it returns every distinct
 * price with its count: one request per group gives the full distribution. Throws if the facet
 * list was truncated (counts don't add up to `found`). Facet-stats `avg` isn't used: it isn't a
 * per-document mean on this server version.
 */
export async function pricePercentiles(
  groups: PriceGroup[],
  percentiles: readonly number[],
  chunkSize = 8,
): Promise<PriceGroupStats[]> {
  const res = await multiSearch(
    groups.map((g) => ({
      per_page: 0,
      facet_by: "price",
      max_facet_values: MAX_PRICE_FACET_VALUES,
      ...(g.filter ? { filter_by: g.filter } : {}),
    })),
    chunkSize,
  );
  return groups.map((g, gi) => {
    const r = res[gi];
    const dist = (r.facet_counts?.find((f) => f.field_name === "price")?.counts ?? [])
      .map((c) => ({ price: Number(c.value), n: c.count }))
      .sort((a, b) => a.price - b.price);
    const total = dist.reduce((s, d) => s + d.n, 0);
    if (total !== r.found) throw new Error(`price facet truncated for "${g.name}": ${total} of ${r.found} docs`);
    const out: PriceGroupStats = {
      name: g.name,
      count: r.found,
      min: dist[0]?.price ?? null,
      max: dist[dist.length - 1]?.price ?? null,
      percentiles: new Map(),
    };
    // Smallest price with at least ceil(p·n) docs at or below it.
    for (const p of percentiles) {
      const target = Math.max(1, Math.ceil(p * total));
      let acc = 0;
      for (const d of dist) {
        acc += d.n;
        if (acc >= target) {
          out.percentiles.set(p, Math.round(d.price));
          break;
        }
      }
    }
    return out;
  });
}
