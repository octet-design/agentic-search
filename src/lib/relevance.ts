/**
 * Scout relevance: one yardstick for our catalog and Shopify. A product counts only if it is exactly
 * what the section asks for (the anchor's words, or the whole category when the anchor is a category).
 * Exact matches from our catalog come first, then Shopify's; each source is ordered by embedding similarity.
 * No Shopify imports: Shopify products arrive as ProductCards (lib/blend.ts).
 */
import { diversify } from "./agent/retrieve";
import type { TaxonomyApi } from "./agent/taxonomy";
import type { Anchor, Intent, ProductCard } from "./agent/types";
import { namedCache } from "./cache";
import { getEnv } from "./env";
import { embedTexts, type Usage } from "./llm";

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/**
 * Does the (normalised) text name this term? Every word of the term must appear as a whole word, in any order,
 * plurals allowed ("virat kohli t-shirt" ~ "Men's White Virat Kohli Printed T-Shirt"); joined or split
 * spellings count too ("tshirt" ~ "t shirt", "chaniya choli" ~ "ChaniyaCholi"). Whole tokens only, so "saree"
 * doesn't match inside a brand like "Sareesbazaar".
 */
export function hasTerm(text: string, term: string): boolean {
  const ws = norm(term).split(" ").filter(Boolean);
  if (!ws.length) return false;
  const tokens = norm(text).split(" ").filter(Boolean);
  const set = new Set(tokens);
  const has = (w: string) => set.has(w) || set.has(`${w}s`) || set.has(`${w}es`) || (w.length > 3 && w.endsWith("s") && set.has(w.slice(0, -1)));
  if (ws.every(has)) return true;
  if (ws.length > 1 && has(ws.join(""))) return true;
  // A one-word term split in the title ("tshirt" ~ "t shirt").
  return ws.length === 1 && tokens.some((t, i) => i + 1 < tokens.length && `${t}${tokens[i + 1]}`.replace(/s$/, "") === ws[0].replace(/s$/, ""));
}

/** Is this product exactly what the anchor names (the item, plus every name the user insisted on)? */
export function isExact(p: ProductCard, anchor: Anchor, sectionCategories: string[], tax: TaxonomyApi): boolean {
  const text = [p.title, p.extraText ?? ""].join(" ");
  if (!(anchor.mustInclude ?? []).every((name) => hasTerm(text, name))) return false;
  if (anchor.terms.some((t) => hasTerm(text, t))) return true;
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
export async function similarityScores(
  query: string,
  products: ProductCard[],
  opts: { usage?: Usage; signal?: AbortSignal } = {},
): Promise<{ score: Map<string, number>; fromEmbeddings: boolean }> {
  const out = new Map<string, number>();
  if (!products.length) return { score: out, fromEmbeddings: false };
  const texts = [query, ...products.map(titleText)];
  const missing = [...new Set(texts.filter((t) => !vectors.get(t)))];
  try {
    if (missing.length) {
      const vecs = await embedTexts({ model: getEnv().OPENAI_MODEL_EMBED, texts: missing, usage: opts.usage, signal: opts.signal });
      missing.forEach((t, i) => vectors.set(t, vecs[i]));
    }
    const q = vectors.get(query)!;
    for (const p of products) out.set(p.id, cosine(q, vectors.get(titleText(p))!));
    return { score: out, fromEmbeddings: true };
  } catch {
    // Fallback: keep each source's own ranking, interleaved by position.
    const pos = new Map<string, number>();
    for (const src of ["typesense", "shopify"]) products.filter((p) => (p.source ?? "typesense") === src).forEach((p, i) => pos.set(p.id, i));
    for (const p of products) out.set(p.id, 1 - (pos.get(p.id) ?? 0) / products.length);
  }
  return { score: out, fromEmbeddings: false };
}

/**
 * Exact by words but not by meaning: "Tee with Headphones Artwork" names headphones but isn't any. Real matches
 * sit within ~0.22 of the best similarity; such items fall ~0.35+ below it. Only applied to real embedding scores.
 */
export const OFF_MEANING_GAP = 0.3;
export function dropOffMeaning<T extends { id: string }>(items: T[], score: Map<string, number>): T[] {
  if (items.length < 2) return items;
  const top = Math.max(...items.map((x) => score.get(x.id) ?? 0));
  return items.filter((x) => (score.get(x.id) ?? 0) >= top - OFF_MEANING_GAP);
}

/** Our catalog's matches first, then Shopify's; each by score, with at most `perBrand` per brand at the top. */
export function catalogFirst(catalog: ProductCard[], shopify: ProductCard[], score: Map<string, number>, limit: number, perBrand = 3): ProductCard[] {
  const bySource = (xs: ProductCard[]) => diversify(orderByRelevance(xs, score), limit, perBrand);
  return [...bySource(catalog), ...bySource(shopify)].slice(0, limit);
}

/** Price order when the shopper asked for it (stable, so equal prices keep their relevance order). */
export function sortByPrice<T extends { price: number }>(items: T[], sort: Intent["sort"] | undefined): T[] {
  if (sort !== "price_asc" && sort !== "price_desc") return items;
  const dir = sort === "price_asc" ? 1 : -1;
  return [...items].sort((a, b) => dir * (a.price - b.price));
}

export type ExactResult = { products: ProductCard[]; exact: { catalog: number; shopify: number } };

/**
 * Scout ranking. With an anchor, only exact matches from either source survive; without one
 * ("more like this"), everything is kept. Our catalog's results come first, then Shopify's, each ordered by
 * similarity to the query, with at most `perBrand` per brand at the top.
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
  /** A requested price sort overrides "ours first": cheapest (or dearest) across both sources. */
  sort?: Intent["sort"];
  usage?: Usage;
  signal?: AbortSignal;
}): Promise<ExactResult> {
  // Stores list colour/size variants as separate products with the same title and price: show one.
  const seen = new Set<string>();
  const key = (p: ProductCard) => `${norm(p.title)}|${Math.round(p.price)}`;
  const unique = (xs: ProductCard[]) => xs.filter((p) => !seen.has(p.id) && !seen.has(key(p)) && (seen.add(p.id), seen.add(key(p)), true));
  const gate = (p: ProductCard) => !opts.anchor?.terms.length || isExact(p, opts.anchor, opts.sectionCategories, opts.tax);
  let catalog = unique(opts.catalog).filter(gate);
  let shopify = unique(opts.shopify).filter(gate);
  const all = [...catalog, ...shopify];
  const { score, fromEmbeddings } = await similarityScores(opts.query, all, { usage: opts.usage, signal: opts.signal });
  // With an anchor (exact matches), also drop items that match the words but not the meaning.
  const keep = new Set((opts.anchor?.terms.length && fromEmbeddings ? dropOffMeaning(all, score) : all).map((x) => x.id));
  const pool = all.filter((x) => keep.has(x.id));
  catalog = catalog.filter((x) => keep.has(x.id));
  shopify = shopify.filter((x) => keep.has(x.id));
  const products = opts.sort === "price_asc" || opts.sort === "price_desc" ? sortByPrice(pool, opts.sort).slice(0, opts.limit) : catalogFirst(catalog, shopify, score, opts.limit, opts.perBrand ?? 3);
  return { products, exact: { catalog: catalog.length, shopify: shopify.length } };
}

/** "No products found" note for a section where neither source had an exact match. */
export const noExactNote = (anchor: Anchor) => `No products found for "${anchor.terms[0]}" in either catalog.`;
