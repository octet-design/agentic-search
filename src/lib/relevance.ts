/**
 * Scout relevance: one yardstick for our catalog and Shopify. A product counts only if it is exactly
 * what the section asks for (the anchor's words, or the whole category when the anchor is a category).
 * Exact matches from both sources are ranked together by embedding similarity, with a small nudge for our catalog.
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

/**
 * For an accessory ("watch strap", forItem "watch"): is this product the main item itself rather than an accessory
 * for it? Catalog products filed under that item's category are; so is any title whose head noun is the item
 * ("Leather Strap Analog Watch", "Black Watch with Leather Strap"), while "Apple Watch Leather Strap (Brown)" stays.
 */
export function isTheItemItself(p: { title: string; category?: string; source?: string }, forItem: string, tax: TaxonomyApi): boolean {
  const item = norm(forItem);
  if (!item) return false;
  if (p.source !== "shopify" && p.category) {
    const cats = tax.classify("category", p.category);
    if (cats.some((c) => namesCategory(item, c, tax))) return true;
  }
  // The title's head noun is its last word once brackets, model codes and "with …" / "for …" parts are stripped:
  // "Black Watch with Leather Strap" is a watch, "Silk Saree with Blouse Piece" is a saree.
  const words = norm(p.title.replace(/\([^)]*\)|\[[^\]]*\]/g, " ").split(/[|·,–—-]\s/)[0].split(/\s(?:with|w\/|for)\s/i)[0])
    .split(" ")
    .filter((w) => w && !/\d/.test(w));
  const head = words.at(-1) ?? "";
  const last = item.split(" ").at(-1)!;
  return head === last || head === `${last}s` || head === `${last}es`;
}

/** Does the item's name name this category itself ("formal shoes" ~ "Formal shoe"), not something narrower ("watch strap" vs "Watch")? */
export function namesCategory(term: string, categoryId: string, tax: TaxonomyApi): boolean {
  const label = tax.label("category", categoryId) || categoryId.replace(/-/g, " ");
  return [label, categoryId.replace(/-/g, " ")].some((name) => hasTerm(name, term) && hasTerm(term, name));
}

/** Is this product exactly what the anchor names (the item, plus every name the user insisted on)? */
export function isExact(p: ProductCard, anchor: Anchor, sectionCategories: string[], tax: TaxonomyApi): boolean {
  const text = [p.title, p.extraText ?? ""].join(" ");
  // An accessory must say what it's for ("watch strap", "iPhone 15 case") and must not be that item itself.
  if (anchor.forItem && (!hasTerm(text, anchor.forItem) || isTheItemItself(p, anchor.forItem, tax))) return false;
  if (!(anchor.mustInclude ?? []).every((name) => hasTerm(text, name))) return false;
  if (anchor.terms.some((t) => hasTerm(text, t))) return true;
  // A whole-category anchor ("saree") accepts catalog items filed under that category, but only categories the
  // item's name really is: "watch strap" filed under "watch" must not let every watch through.
  if (anchor.categoryLevel && p.source !== "shopify" && p.category && sectionCategories.length) {
    const named = sectionCategories.filter((c) => anchor.terms.some((t) => namesCategory(t, c, tax)));
    const ok = new Set(named.flatMap((c) => [c, ...tax.children(c)]));
    return ok.size > 0 && tax.classify("category", p.category).some((c) => ok.has(c));
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

/** How much our catalog is preferred: it wins when a Shopify product is at most this much more relevant. */
export const CATALOG_NUDGE = 0.03;
/** Photo searches: Shopify's visual-similarity order adds up to this much (its first result most). */
export const VISUAL_BONUS = 0.05;

/**
 * One ranking for both sources: relevance to the request, plus a small nudge for our catalog (ours wins near-ties,
 * a clearly better Shopify product still comes first) and, for photo searches, Shopify's visual-match order.
 * At most `perBrand` per brand at the top. Pure; unit-tested.
 */
export function mixByRelevance(
  catalog: ProductCard[],
  shopify: ProductCard[],
  score: Map<string, number>,
  limit: number,
  opts: { perBrand?: number; visual?: boolean } = {},
): ProductCard[] {
  const mixed = new Map(score);
  for (const p of catalog) mixed.set(p.id, (mixed.get(p.id) ?? 0) + CATALOG_NUDGE);
  if (opts.visual && shopify.length) shopify.forEach((p, i) => mixed.set(p.id, (mixed.get(p.id) ?? 0) + VISUAL_BONUS * (1 - i / shopify.length)));
  return diversify(orderByRelevance([...catalog, ...shopify], mixed), limit, opts.perBrand ?? 3).slice(0, limit);
}

/** Price order when the shopper asked for it (stable, so equal prices keep their relevance order). */
export function sortByPrice<T extends { price: number }>(items: T[], sort: Intent["sort"] | undefined): T[] {
  if (sort !== "price_asc" && sort !== "price_desc") return items;
  const dir = sort === "price_asc" ? 1 : -1;
  return [...items].sort((a, b) => dir * (a.price - b.price));
}

export type ExactResult = { products: ProductCard[]; exact: { catalog: number; shopify: number }; storeNote?: string };

const squash = (s: string) => norm(s).replace(/ /g, "");
/** Is this product from the store the shopper asked for ("DailyObjects" ~ "Daily Objects", "dailyobjects.com")? */
export function fromStore(p: { brand: string; domain?: string }, store: string): boolean {
  const want = squash(store);
  if (want.length < 3) return false;
  return [p.brand, p.domain ?? ""].some((x) => {
    const have = squash(x);
    return have.length >= 3 && (have.includes(want) || want.includes(have));
  });
}

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
  /** A requested price sort overrides relevance: cheapest (or dearest) across both sources. */
  sort?: Intent["sort"];
  /** Photo search: Shopify's results are in visual-similarity order, which counts toward relevance. */
  visual?: boolean;
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
  // A store the shopper asked for: only its products when it has any; otherwise everyone's, with a note.
  let storeNote: string | undefined;
  const store = opts.anchor?.store?.trim();
  if (store) {
    const c = catalog.filter((p) => fromStore(p, store));
    const s = shopify.filter((p) => fromStore(p, store));
    if (c.length + s.length) {
      catalog = c;
      shopify = s;
    } else if (catalog.length + shopify.length) storeNote = `Couldn't find ${store} in our stores, so these are from other sellers.`;
  }
  const ranked = new Set([...catalog, ...shopify].map((x) => x.id));
  const products =
    opts.sort === "price_asc" || opts.sort === "price_desc"
      ? sortByPrice(pool.filter((x) => ranked.has(x.id)), opts.sort).slice(0, opts.limit)
      : mixByRelevance(catalog, shopify, score, opts.limit, { perBrand: opts.perBrand, visual: opts.visual });
  return { products, exact: { catalog: catalog.length, shopify: shopify.length }, ...(storeNote ? { storeNote } : {}) };
}

/** "No products found" note for a section where neither source had an exact match. */
export const noExactNote = (anchor: Anchor) => `No products found for "${anchor.terms[0]}" in either catalog.`;
