/**
 * Blend search relevance: one yardstick for our catalog and Shopify. A product counts only if it is exactly
 * what the section asks for (the anchor's words, or the whole category when the anchor is a category), and
 * exact matches are ordered by embedding similarity to the query, with our catalog first on ties.
 * No Shopify imports: Shopify products arrive as ProductCards (lib/blend.ts).
 */
import { diversify } from "./agent/retrieve";
import type { TaxonomyApi } from "./agent/taxonomy";
import type { Anchor, ProductCard } from "./agent/types";
import { namedCache } from "./cache";
import { getEnv } from "./env";
import { embedTexts, type Usage } from "./llm";

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** "chaniya choli" → matches "Chaniya-Choli", "chaniya cholis", "ChaniyaCholi" (words may be joined or split). */
function termPattern(term: string): RegExp | null {
  const words = norm(term).split(" ").filter(Boolean);
  if (!words.length) return null;
  return new RegExp(`\\b${words.map(escape).join("\\s*")}s?\\b`);
}

/** Is this product exactly what the anchor names? */
export function isExact(p: ProductCard, anchor: Anchor, sectionCategories: string[], tax: TaxonomyApi): boolean {
  const text = norm([p.title, p.extraText ?? ""].join(" "));
  if (anchor.terms.some((t) => termPattern(t)?.test(text))) return true;
  // A whole-category anchor ("saree") accepts catalog items filed under that category.
  if (anchor.categoryLevel && p.source !== "shopify" && p.category && sectionCategories.length) {
    const ok = new Set(sectionCategories.flatMap((c) => [c, ...tax.children(c)]));
    return tax.classify("category", p.category).some((c) => ok.has(c));
  }
  return false;
}

/** Scores within this many points count as a tie (then our catalog goes first). */
export const TIE = 0.02;

/**
 * Orders by score, catalog first among near-equal scores. Scores are bucketed by TIE so the sort stays
 * consistent (a pairwise "within 0.02" comparison wouldn't be transitive).
 */
export function orderByRelevance<T extends { id: string; source?: string }>(items: T[], score: Map<string, number>): T[] {
  const bucket = (x: T) => Math.floor((score.get(x.id) ?? 0) / TIE);
  return [...items].sort(
    (a, b) => bucket(b) - bucket(a) || Number(a.source === "shopify") - Number(b.source === "shopify") || (score.get(b.id) ?? 0) - (score.get(a.id) ?? 0),
  );
}

const vectors = namedCache<number[]>("embed-text", 5000, 24 * 60 * 60_000);

const cosine = (a: number[], b: number[]) => {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na * nb) || 1);
};

const titleText = (p: ProductCard) => `${p.title} ${p.brand}`.slice(0, 300);

/**
 * Similarity of each product title to the query on one embedding scale (cached per text). If the embedding
 * call fails, falls back to each source's own order, so nothing breaks.
 */
export async function similarityScores(query: string, products: ProductCard[], opts: { usage?: Usage; signal?: AbortSignal } = {}): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  if (!products.length) return out;
  const texts = [query, ...products.map(titleText)];
  const missing = [...new Set(texts.filter((t) => !vectors.get(t)))];
  try {
    if (missing.length) {
      const vecs = await embedTexts({ model: getEnv().OPENAI_MODEL_EMBED, texts: missing, usage: opts.usage, signal: opts.signal });
      missing.forEach((t, i) => vectors.set(t, vecs[i]));
    }
    const q = vectors.get(query)!;
    for (const p of products) out.set(p.id, cosine(q, vectors.get(titleText(p))!));
  } catch {
    // Fallback: keep each source's own ranking, interleaved by position.
    const pos = new Map<string, number>();
    for (const src of ["typesense", "shopify"]) products.filter((p) => (p.source ?? "typesense") === src).forEach((p, i) => pos.set(p.id, i));
    for (const p of products) out.set(p.id, 1 - (pos.get(p.id) ?? 0) / products.length);
  }
  return out;
}

export type ExactResult = { products: ProductCard[]; exact: { catalog: number; shopify: number } };

/**
 * Blend search ranking. With an anchor, only exact matches from either source survive; without one
 * ("more like this"), everything is ranked by similarity. Then: one embedding scale, catalog first on ties,
 * at most `perBrand` per brand at the top.
 */
export async function rankBlend(opts: {
  catalog: ProductCard[];
  shopify: ProductCard[];
  query: string;
  anchor: Anchor | null;
  sectionCategories: string[];
  tax: TaxonomyApi;
  limit: number;
  perBrand?: number;
  usage?: Usage;
  signal?: AbortSignal;
}): Promise<ExactResult> {
  const seen = new Set<string>();
  const unique = (xs: ProductCard[]) => xs.filter((p) => !seen.has(p.id) && (seen.add(p.id), true));
  const gate = (p: ProductCard) => !opts.anchor?.terms.length || isExact(p, opts.anchor, opts.sectionCategories, opts.tax);
  const catalog = unique(opts.catalog).filter(gate);
  const shopify = unique(opts.shopify).filter(gate);
  const pool = [...catalog, ...shopify];
  const score = await similarityScores(opts.query, pool, { usage: opts.usage, signal: opts.signal });
  const ranked = diversify(orderByRelevance(pool, score), opts.limit, opts.perBrand ?? 3);
  return { products: ranked.slice(0, opts.limit), exact: { catalog: catalog.length, shopify: shopify.length } };
}

/** "No products found" note for a section where neither source had an exact match. */
export const noExactNote = (anchor: Anchor) => `No products found for "${anchor.terms[0]}" in either catalog.`;
