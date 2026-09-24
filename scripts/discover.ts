/**
 * Milestone 0: catalog discovery.
 *
 * Writes:
 *   data/raw-facets/<field>.json   every facet value with counts
 *   data/discovery/report.json     counts, price stats, sample stats, hybrid query checks
 *   data/discovery/sample.json     the 30 random documents (without embedding)
 *
 * Usage: npm run discover
 * The human-written summary and decisions live in docs/catalog-notes.md.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { getTypesense, productsCollection } from "../src/lib/typesense";
import { getEnv } from "../src/lib/env";

const ROOT = path.resolve(__dirname, "..");
const FACET_DIR = path.join(ROOT, "data", "raw-facets");
const REPORT_DIR = path.join(ROOT, "data", "discovery");

const FACET_FIELDS = ["gender", "category", "color", "fabric", "fit", "pattern", "use_case", "sizes", "brand"];
const MULTI_VALUED = new Set(["use_case", "sizes"]);
const MAX_FACET_VALUES = 100_000;
const SAMPLE_SIZE = 30;
const COVERAGE_PAGES = 8;
const COVERAGE_PER_PAGE = 125;
const MULTI_SEARCH_CHUNK = 40;
const PERCENTILES = [0.1, 0.25, 0.5, 0.75, 0.9] as const;

// ---------- Typesense helpers ----------

type Params = Record<string, string | number | boolean>;
type FacetCount = {
  field_name: string;
  counts: { value: string; count: number }[];
  stats?: { min?: number; max?: number; avg?: number; sum?: number; total_values?: number };
};
type Hit = { document: Record<string, unknown>; text_match?: number; vector_distance?: number; hybrid_search_info?: unknown; text_match_info?: unknown };
type SearchResult = {
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

async function search(params: Params): Promise<SearchResult> {
  const res = await collection().search({ q: "*", query_by: "title", ...params } as never);
  return res as unknown as SearchResult;
}

/** Runs many searches via multi_search (POST), chunked, preserving order. Throws on per-search errors. */
async function multiSearch(searches: Params[]): Promise<SearchResult[]> {
  const out: SearchResult[] = [];
  for (let i = 0; i < searches.length; i += MULTI_SEARCH_CHUNK) {
    const chunk = searches.slice(i, i + MULTI_SEARCH_CHUNK).map((s) => ({
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
async function searchMany(searches: Params[], concurrency = 5): Promise<SearchResult[]> {
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

const esc = (v: string) => "`" + v.replace(/`/g, "\\`") + "`";
const and = (...parts: (string | undefined)[]) => parts.filter(Boolean).join(" && ");

async function count(filter?: string): Promise<number> {
  const r = await search({ per_page: 0, ...(filter ? { filter_by: filter } : {}) });
  return r.found;
}

// ---------- 1. counts ----------

async function discoverCounts() {
  const [total, inStock, outOfStock, activeTrue, activeFalse, inStockActive, inStockNotInactive] =
    await Promise.all([
      count(),
      count("in_stock:true"),
      count("in_stock:false"),
      count("is_active:true"),
      count("is_active:false"),
      count("in_stock:true && is_active:true"),
      count("in_stock:true && is_active:!=false"),
    ]);
  return {
    total,
    in_stock_true: inStock,
    in_stock_false: outOfStock,
    is_active_true: activeTrue,
    is_active_false: activeFalse,
    is_active_missing: total - activeTrue - activeFalse,
    in_stock_and_active_true: inStockActive,
    // `!=false` semantics differ across Typesense versions for missing values; recorded to decide the base filter.
    in_stock_and_active_not_false: inStockNotInactive,
  };
}

// ---------- 2. facets ----------

async function discoverFacets(total: number) {
  const summary: Record<string, unknown> = {};
  for (const field of FACET_FIELDS) {
    const r = await search({ per_page: 0, facet_by: field, max_facet_values: MAX_FACET_VALUES });
    const fc = r.facet_counts?.find((f) => f.field_name === field);
    const values = (fc?.counts ?? [])
      .map((c) => ({ value: c.value, count: c.count }))
      .sort((a, b) => b.count - a.count);
    const sum = values.reduce((s, v) => s + v.count, 0);
    const truncated = values.length >= MAX_FACET_VALUES;
    const lowCount = values.filter((v) => v.count < 5).length;
    const entry = {
      field,
      multiValued: MULTI_VALUED.has(field),
      distinctValues: values.length,
      reportedTotalValues: fc?.stats?.total_values ?? null,
      truncated,
      valuesWithCountBelow5: lowCount,
      // For single-valued fields, sum/total ≈ share of docs that have the field set.
      coverage: MULTI_VALUED.has(field) || truncated ? null : round(sum / total, 4),
      sumOfCounts: sum,
      values,
    };
    await writeJson(path.join(FACET_DIR, `${field}.json`), entry);
    summary[field] = {
      distinctValues: entry.distinctValues,
      truncated,
      valuesWithCountBelow5: lowCount,
      coverage: entry.coverage,
      top15: values.slice(0, 15),
    };
    console.log(`  facet ${field.padEnd(9)} ${String(values.length).padStart(6)} values${truncated ? " (TRUNCATED)" : ""}`);
  }
  return summary;
}

// ---------- 3. price distribution (exact percentiles by bisection on count queries) ----------

type PriceGroup = { name: string; filter?: string };

async function priceStats(groups: PriceGroup[]) {
  // min/max/avg per group from facet stats.
  const statsRes = await multiSearch(
    groups.map((g) => ({
      per_page: 0,
      facet_by: "price",
      ...(g.filter ? { filter_by: g.filter } : {}),
    })),
  );

  type State = { group: PriceGroup; p: number; target: number; lo: number; hi: number };
  const states: State[] = [];
  const base = groups.map((g, i) => {
    const r = statsRes[i];
    const s = r.facet_counts?.find((f) => f.field_name === "price")?.stats ?? {};
    const n = r.found;
    for (const p of PERCENTILES) {
      if (n > 0 && s.min !== undefined && s.max !== undefined) {
        states.push({ group: g, p, target: Math.max(1, Math.ceil(p * n)), lo: s.min, hi: s.max });
      }
    }
    // Facet-stats `avg` is not a per-document mean on this server version, so it is not reported.
    return { name: g.name, count: n, min: s.min ?? null, max: s.max ?? null };
  });

  // Smallest x with count(price <= x) >= target, to ~₹1 precision. All groups bisect in parallel.
  for (let iter = 0; iter < 40; iter++) {
    const active = states.filter((s) => s.hi - s.lo > 1);
    if (!active.length) break;
    const mids = active.map((s) => (s.lo + s.hi) / 2);
    const res = await multiSearch(
      active.map((s, i) => ({ per_page: 0, filter_by: and(s.group.filter, `price:<=${mids[i].toFixed(2)}`) })),
    );
    active.forEach((s, i) => {
      if (res[i].found >= s.target) s.hi = mids[i];
      else s.lo = mids[i];
    });
  }

  return base.map((b) => {
    const row: Record<string, number | string | null> = { ...b };
    for (const p of PERCENTILES) {
      const s = states.find((x) => x.group.name === b.name && x.p === p);
      row[p === 0.5 ? "median" : `p${Math.round(p * 100)}`] = s ? Math.round(s.hi) : null;
    }
    return {
      name: row.name, count: row.count, min: row.min, p10: row.p10, p25: row.p25,
      median: row.median, p75: row.p75, p90: row.p90, max: row.max,
    };
  });
}

// ---------- 4. sampling ----------

function domainOf(url: unknown): string | null {
  if (typeof url !== "string" || !url.trim()) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "(invalid)";
  }
}

function tally(items: (string | null)[]) {
  const m = new Map<string, number>();
  for (const it of items) m.set(it ?? "(none)", (m.get(it ?? "(none)") ?? 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([value, count]) => ({ value, count }));
}

function randomInts(n: number, max: number): number[] {
  const set = new Set<number>();
  while (set.size < Math.min(n, max)) set.add(1 + Math.floor(Math.random() * max));
  return [...set];
}

function describeText(s: unknown) {
  const t = typeof s === "string" ? s : "";
  return {
    length: t.length,
    hasDevanagari: /[ऀ-ॿ]/.test(t),
    hasHtml: /<\/?[a-z][^>]*>/i.test(t),
    nonAsciiShare: t.length ? round([...t].filter((c) => c.charCodeAt(0) > 127).length / t.length, 3) : 0,
  };
}

async function sampleDocs(total: number) {
  // Random single-doc pages give a genuinely random sample; `sort_by: _rand(seed)` was rejected by this server.
  const pages = randomInts(SAMPLE_SIZE, total);
  const res = await searchMany(pages.map((page) => ({ per_page: 1, page, exclude_fields: "embedding" })));
  const docs = res.map((r) => r.hits?.[0]?.document).filter((d): d is Record<string, unknown> => !!d);

  // A wider (clustered) sample for coverage/domain statistics.
  const covPages = randomInts(COVERAGE_PAGES, Math.max(1, Math.floor(total / COVERAGE_PER_PAGE)));
  const cov = await searchMany(
    covPages.map((page) => ({ per_page: COVERAGE_PER_PAGE, page, exclude_fields: "embedding,description" })),
  );
  const wide = cov.flatMap((r) => (r.hits ?? []).map((h) => h.document));

  const descStats = docs.map((d) => describeText(d.description));
  const lengths = descStats.map((d) => d.length).sort((a, b) => a - b);

  return {
    docs,
    stats: {
      sampleSize: docs.length,
      wideSampleSize: wide.length,
      imageUrlCoverage: {
        sample: round(docs.filter((d) => domainOf(d.image_url)).length / Math.max(1, docs.length), 3),
        wide: round(wide.filter((d) => domainOf(d.image_url)).length / Math.max(1, wide.length), 3),
      },
      imageDomains: tally(wide.map((d) => domainOf(d.image_url))),
      productUrlDomains: tally(wide.map((d) => domainOf(d.product_url))),
      fieldPresenceInWideSample: Object.fromEntries(
        ["brand", "category", "gender", "color", "fabric", "fit", "pattern", "use_case", "sizes", "price", "in_stock", "is_active", "image_url", "product_url"].map((f) => [
          f,
          round(wide.filter((d) => d[f] !== undefined && d[f] !== null && d[f] !== "" && !(Array.isArray(d[f]) && (d[f] as unknown[]).length === 0)).length / Math.max(1, wide.length), 3),
        ]),
      ),
      description: {
        minLength: lengths[0] ?? 0,
        medianLength: lengths[Math.floor(lengths.length / 2)] ?? 0,
        maxLength: lengths[lengths.length - 1] ?? 0,
        empty: descStats.filter((d) => d.length === 0).length,
        withDevanagari: descStats.filter((d) => d.hasDevanagari).length,
        withHtml: descStats.filter((d) => d.hasHtml).length,
        identicalToTitle: docs.filter((d) => typeof d.description === "string" && d.description.trim() === String(d.title ?? "").trim()).length,
      },
    },
  };
}

/** Checks whether image hosts allow hotlinking (no Referer, and a localhost Referer). */
async function checkImageHotlinking(docs: Record<string, unknown>[]) {
  const urls = [...new Map(docs.map((d) => [domainOf(d.image_url), d.image_url])).values()]
    .filter((u): u is string => typeof u === "string" && !!u)
    .slice(0, 10);
  const probe = async (url: string, referer?: string) => {
    try {
      const r = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0 Safari/537.36", ...(referer ? { Referer: referer } : {}) },
        signal: AbortSignal.timeout(8000),
      });
      await r.body?.cancel();
      return `${r.status} ${r.headers.get("content-type") ?? ""}`.trim();
    } catch (err) {
      return `ERR ${err instanceof Error ? err.message : String(err)}`;
    }
  };
  return Promise.all(
    urls.map(async (url) => ({
      domain: domainOf(url),
      noReferer: await probe(url),
      localhostReferer: await probe(url, "http://localhost:3000/"),
    })),
  );
}

// ---------- 5. hybrid query checks ----------

const HYBRID_QUERIES = [
  "black cotton kurta set for office",
  "floral maxi dress",
  "white sneakers for men",
  "party dress for a little girl",
  "warm winter jacket for women",
];

async function hybridChecks() {
  const variants: { name: string; params: Params }[] = [
    { name: "keyword title", params: { query_by: "title" } },
    {
      name: "hybrid title,embedding α0.5 rerank",
      params: { query_by: "title,embedding", vector_query: "embedding:([], k: 250, alpha: 0.5)", rerank_hybrid_matches: true },
    },
    {
      name: "hybrid title,brand,embedding α0.5",
      params: { query_by: "title,brand,embedding", vector_query: "embedding:([], k: 250, alpha: 0.5)" },
    },
  ];

  const rows = [];
  for (const q of HYBRID_QUERIES) {
    for (const v of variants) {
      const t0 = performance.now();
      try {
        const r = await search({ q, per_page: 10, exclude_fields: "embedding", ...v.params });
        const hits = r.hits ?? [];
        rows.push({
          query: q,
          variant: v.name,
          ok: true,
          found: r.found,
          serverMs: r.search_time_ms,
          roundTripMs: Math.round(performance.now() - t0),
          hitsHaveVectorDistance: hits.some((h) => h.vector_distance !== undefined),
          hitsHaveHybridInfo: hits.some((h) => h.hybrid_search_info !== undefined),
          top5: hits.slice(0, 5).map((h) => ({
            title: h.document.title,
            brand: h.document.brand,
            gender: h.document.gender,
            price: h.document.price,
            vector_distance: h.vector_distance ?? null,
          })),
        });
      } catch (err) {
        rows.push({ query: q, variant: v.name, ok: false, error: err instanceof Error ? err.message : String(err), roundTripMs: Math.round(performance.now() - t0) });
      }
    }
  }
  return rows;
}

// ---------- data-quality probes ----------

async function qualityProbes(genderValues: string[]) {
  // Which categories sit behind each gender value (reveals non-fashion "other" buckets).
  const byGender = await multiSearch(
    genderValues.map((g) => ({ per_page: 0, filter_by: `gender:=${esc(g)}`, facet_by: "category", max_facet_values: 15 })),
  );
  const priceFilters = ["price:<50", "price:<100", "price:>200000", "price:>500000"];
  const prices = await multiSearch(priceFilters.map((f) => ({ per_page: 0, filter_by: f })));
  const cheapest = await search({ per_page: 8, filter_by: "price:<100", exclude_fields: "embedding,description" });
  const otherCategory = await search({ per_page: 10, filter_by: "category:=`other`", exclude_fields: "embedding,description" });
  const pick = (r: SearchResult) =>
    (r.hits ?? []).map((h) => `${h.document.gender} | ${h.document.brand} | ₹${h.document.price} | ${String(h.document.title).slice(0, 70)}`);
  return {
    categoriesByGender: Object.fromEntries(
      genderValues.map((g, i) => [g, (byGender[i].facet_counts?.[0]?.counts ?? []).map((c) => ({ value: c.value, count: c.count }))]),
    ),
    priceOutliers: Object.fromEntries(priceFilters.map((f, i) => [f, prices[i].found])),
    cheapestExamples: pick(cheapest),
    categoryOtherExamples: pick(otherCategory),
  };
}

// ---------- server info (best effort; the search key may be forbidden from these) ----------

async function serverInfo() {
  const client = getTypesense();
  const safe = async <T>(fn: () => Promise<T>) => {
    try {
      return await fn();
    } catch (err) {
      return { forbiddenOrFailed: err instanceof Error ? err.message : String(err) };
    }
  };
  return {
    health: await safe(() => client.health.retrieve()),
    debug: await safe(() => client.debug.retrieve()),
    schema: await safe(async () => {
      const c = await client.collections(productsCollection()).retrieve();
      return { num_documents: c.num_documents, fields: c.fields };
    }),
  };
}

// ---------- utils + main ----------

function round(n: number, dp: number) {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}

async function writeJson(file: string, data: unknown) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(data, null, 2) + "\n", "utf8");
}

async function main() {
  const env = getEnv();
  const started = Date.now();
  console.log(`Discovering "${env.TYPESENSE_COLLECTION}"…`);

  const server = await serverInfo();
  console.log("1/5 counts");
  const counts = await discoverCounts();
  console.log(`  total ${counts.total.toLocaleString("en-IN")} · in_stock ${counts.in_stock_true.toLocaleString("en-IN")} · is_active true/false/missing ${counts.is_active_true}/${counts.is_active_false}/${counts.is_active_missing}`);

  console.log("2/5 facets");
  const facets = await discoverFacets(counts.total);

  console.log("3/5 price distribution");
  const genderValues = (
    (await search({ per_page: 0, facet_by: "gender", max_facet_values: 200 })).facet_counts?.[0]?.counts ?? []
  ).map((c) => c.value);
  const price = await priceStats([
    { name: "all" },
    { name: "all · in_stock", filter: "in_stock:true" },
    ...genderValues.map((g) => ({ name: `gender=${g}`, filter: `gender:=${esc(g)}` })),
  ]);
  console.table(price);

  console.log("4/5 sampling");
  const sample = await sampleDocs(counts.total);
  const hotlinking = await checkImageHotlinking(sample.docs);
  console.log(`  image_url coverage ${sample.stats.imageUrlCoverage.wide} · ${sample.stats.productUrlDomains.length} product domains`);

  console.log("5/5 hybrid queries");
  const hybrid = await hybridChecks();
  const quality = await qualityProbes(genderValues);
  for (const h of hybrid) {
    console.log(`  ${h.ok ? "ok " : "ERR"} ${String(h.roundTripMs).padStart(5)}ms  ${h.variant.padEnd(34)} ${h.query}${h.ok ? "" : ` → ${"error" in h ? h.error : ""}`}`);
  }

  await writeJson(path.join(REPORT_DIR, "sample.json"), sample.docs);
  await writeJson(path.join(REPORT_DIR, "report.json"), {
    generatedAt: new Date().toISOString(),
    collection: env.TYPESENSE_COLLECTION,
    server,
    counts,
    facets,
    price,
    sample: sample.stats,
    imageHotlinking: hotlinking,
    hybrid,
    quality,
  });
  console.log(`Done in ${((Date.now() - started) / 1000).toFixed(1)}s → data/raw-facets/, data/discovery/`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.stack ?? err.message : err);
  process.exit(1);
});
