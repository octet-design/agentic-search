/**
 * Vector neighbours from stored embeddings: "More like this" (§9.4) and the "For you" rail (§8.3).
 * Only light filters go to Typesense (filtered vector search is slow on this server); changes and
 * exclusions are checked in code.
 */
import { hashKey, namedCache } from "./cache";
import { andFilters, baseFilter, escapeFilterValue, inFilter, notInFilter } from "./agent/filters";
import { makeChecker } from "./agent/postFilter";
import { curate, diversify, multiSearch } from "./agent/retrieve";
import { getTaxonomy } from "./agent/taxonomy";
import { emptyIntent, type Intent, type ProductCard, type RawProduct } from "./agent/types";

const embCache = namedCache<Map<string, { vec: number[]; doc: RawProduct }>>("emb", 50, 30 * 60_000);

/** Embeddings + docs for ids (include_fields=embedding via a filtered search). */
export async function getEmbeddings(ids: string[]): Promise<Map<string, { vec: number[]; doc: RawProduct }>> {
  const unique = [...new Set(ids)].slice(0, 20);
  const key = hashKey(unique);
  const hit = embCache.get(key);
  if (hit) return hit;
  const [res] = await multiSearch([
    { q: "*", query_by: "title", filter_by: `id:[${unique.map(escapeFilterValue).join(",")}]`, per_page: unique.length, include_fields: "*" },
  ]);
  const out = new Map<string, { vec: number[]; doc: RawProduct }>();
  for (const h of res.hits ?? []) {
    const d = h.document as RawProduct & { embedding?: number[] };
    if (Array.isArray(d.embedding) && d.embedding.length) out.set(d.id, { vec: d.embedding, doc: d });
  }
  embCache.set(key, out);
  return out;
}

/** Same-audience genders for a product's raw gender value. */
export function gendersLike(rawGender: string): string[] {
  switch (rawGender) {
    case "female":
      return ["female", "unisex"];
    case "male":
      return ["male", "unisex"];
    case "unisex":
      return ["unisex", "female", "male"];
    default:
      return [rawGender];
  }
}

export function meanVector(vecs: number[][]): number[] {
  const dim = vecs[0]?.length ?? 0;
  const out = new Array<number>(dim).fill(0);
  for (const v of vecs) for (let i = 0; i < dim; i++) out[i] += v[i] / vecs.length;
  const norm = Math.hypot(...out) || 1;
  return out.map((x) => x / norm);
}

export async function vectorNeighbours(opts: {
  vector: number[];
  genders: string[];
  excludeIds: string[];
  k?: number;
  /** Extra constraints ("in blue", refine changes) checked in code. */
  intent?: Intent;
}): Promise<ProductCard[]> {
  const tax = getTaxonomy();
  const k = opts.k ?? 24;
  const filter = andFilters(
    baseFilter({ excludedGenders: tax.excludedGenders(), excludedCategoryValues: tax.excludedCategoryValues() }),
    inFilter("gender", opts.genders),
    notInFilter("id", opts.excludeIds.slice(0, 200)),
  );
  const [res] = await multiSearch([
    {
      q: "*",
      vector_query: `embedding:([${opts.vector.map((x) => x.toFixed(6)).join(",")}], k: 150)`,
      filter_by: filter,
      per_page: 150,
      exclude_fields: "embedding",
    },
  ]);
  const intent = opts.intent ?? emptyIntent("");
  const checker = makeChecker(intent, tax);
  const hits = (res.hits ?? []).filter((h) => {
    const d = h.document as RawProduct;
    return !checker.unmet(d).filter((u) => u !== "audience").length;
  });
  const dropped: Record<string, number> = {};
  const cards = curate(hits, intent, tax, dropped).map((p, i) => ({ ...p, score: 1 - i / 150, reason: similarReason(p) }));
  return diversify(cards, k, 2).slice(0, k);
}

function similarReason(p: ProductCard): string {
  const bits = [p.color, p.fabric, p.pattern && p.pattern !== "solid" ? p.pattern : null].filter(Boolean) as string[];
  return bits.length ? `Similar look · ${bits.slice(0, 2).map((b) => b[0].toUpperCase() + b.slice(1)).join(" · ")}` : "Similar look";
}
