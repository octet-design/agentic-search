/**
 * Aura++ on Drape's Typesense catalog: the Pinterest-style feed and "More from this brand". No LLM calls:
 * curated queries use Typesense hybrid search (it embeds the text itself), personal picks are vector neighbours
 * of what the shopper saved (the same signal as /api/for-you).
 */
import { namedCache } from "./cache";
import { andFilters, baseFilter, inFilter, notInFilter } from "./agent/filters";
import { multiSearch, toCard } from "./agent/retrieve";
import { getTaxonomy } from "./agent/taxonomy";
import type { ProductCard, RawProduct } from "./agent/types";
import { getRawProducts } from "./products";
import { gendersLike, getEmbeddings, meanVector, vectorNeighbours } from "./similar";

/** Feed items are plain cards; `reason` says why one is there ("Close to things you saved"), empty for curated picks. */
export type FeedPage = { items: ProductCard[]; cursor: string };

/** Concrete, catalog-friendly queries (abstract ones like "new arrivals" don't search well). */
export const CURATED = [
  "linen co-ord set women",
  "white sneakers men",
  "chikankari kurta women",
  "floral maxi dress",
  "oversized shirt men",
  "block heel sandals women",
  "denim jacket",
  "silk saree",
  "kurta pyjama set men",
  "jhumka earrings",
  "leather tote bag women",
  "linen trousers men",
  "party wear dress women",
  "polo t-shirt men",
  "printed palazzo women",
  "kids ethnic wear",
];
const PER_QUERY = 8;
const QUERIES_PER_PAGE = 3;
const PERSONAL_PER_PAGE = 10;

/** Which curated query is next, which "round" through the list we're on, and how far into the personal list. */
type CursorState = { c: number; round: number; personal: number };
const encode = (s: CursorState) => Buffer.from(JSON.stringify(s)).toString("base64url");
export function decodeCursor(raw: string | null | undefined): CursorState {
  try {
    const v = raw ? (JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as CursorState) : null;
    return v && Number.isInteger(v.c) && Number.isInteger(v.round) && Number.isInteger(v.personal) ? v : { c: 0, round: 0, personal: 0 };
  } catch {
    return { c: 0, round: 0, personal: 0 };
  }
}

/** Round-robin merge, dropping repeats and excluded ids; keeps each item's reason. */
export function interleave(lists: ProductCard[][], exclude: Set<string>): ProductCard[] {
  const out: ProductCard[] = [];
  const seen = new Set(exclude);
  for (let i = 0; lists.some((l) => i < l.length); i++) {
    for (const l of lists) {
      const it = l[i];
      if (it && !seen.has(it.id)) {
        seen.add(it.id);
        out.push(it);
      }
    }
  }
  return out;
}

const pages = namedCache<ProductCard[]>("aura-plus-curated", 400, 10 * 60_000);
const personal = namedCache<ProductCard[]>("aura-plus-personal", 200, 10 * 60_000);

async function curatedPage(query: string, page: number): Promise<ProductCard[]> {
  const key = `${query}|${page}`;
  const hit = pages.get(key);
  if (hit) return hit;
  const tax = getTaxonomy();
  const [res] = await multiSearch([
    {
      q: query,
      query_by: "title,embedding",
      vector_query: "embedding:([], k: 200, alpha: 0.5)",
      filter_by: baseFilter({ excludedGenders: tax.excludedGenders(), excludedCategoryValues: tax.excludedCategoryValues() }),
      per_page: PER_QUERY,
      page,
      exclude_fields: "embedding,description",
    },
  ]);
  const cards = (res?.hits ?? []).map((h) => h.document as RawProduct).filter((d) => d.image_url).map((d) => toCard(d, 0, tax));
  pages.set(key, cards);
  return cards;
}

/** Vector neighbours of the mean of what they saved (newest 10), cached per seed set. */
async function personalPicks(seedIds: string[]): Promise<ProductCard[]> {
  if (!seedIds.length) return [];
  const key = seedIds.join(",");
  const hit = personal.get(key);
  if (hit) return hit;
  const embs = [...(await getEmbeddings(seedIds)).values()];
  if (!embs.length) return [];
  const cards = await vectorNeighbours({
    vector: meanVector(embs.map((e) => e.vec)),
    genders: [...new Set(embs.flatMap((e) => gendersLike(e.doc.gender)))],
    excludeIds: seedIds,
    k: 120,
  });
  personal.set(key, cards);
  return cards;
}

export async function feedPage(opts: { seedIds: string[]; excludeIds: string[]; cursor?: string | null }): Promise<FeedPage> {
  const st = decodeCursor(opts.cursor);
  const queries = Array.from({ length: QUERIES_PER_PAGE }, (_, i) => {
    const idx = st.c + i;
    return { q: CURATED[idx % CURATED.length], page: st.round + Math.floor(idx / CURATED.length) + 1 };
  });
  const [mine, ...curated] = await Promise.all([
    personalPicks(opts.seedIds.slice(-10)).catch(() => [] as ProductCard[]),
    ...queries.map((x) => curatedPage(x.q, x.page).catch(() => [] as ProductCard[])),
  ]);
  const personalSlice = mine.slice(st.personal, st.personal + PERSONAL_PER_PAGE).map((p) => ({ ...p, reason: "Close to things you saved" }));
  const items = interleave([personalSlice, ...curated.map((l) => l.map((p) => ({ ...p, reason: "" })))], new Set([...opts.excludeIds, ...opts.seedIds]));

  const nextC = st.c + QUERIES_PER_PAGE;
  const next: CursorState = { c: nextC % CURATED.length, round: st.round + Math.floor(nextC / CURATED.length), personal: st.personal + personalSlice.length };
  return { items, cursor: encode(next) };
}

/** Other in-stock products from the same brand as this product. */
export async function moreFromBrand(id: string, k = 12): Promise<{ brand: string | null; products: ProductCard[] }> {
  const [raw] = await getRawProducts([id]);
  if (!raw?.brand) return { brand: null, products: [] };
  const tax = getTaxonomy();
  const [res] = await multiSearch([
    {
      q: "*",
      filter_by: andFilters(
        baseFilter({ excludedGenders: tax.excludedGenders(), excludedCategoryValues: tax.excludedCategoryValues() }),
        inFilter("brand", [raw.brand]),
        notInFilter("id", [id]),
      ),
      per_page: k * 2,
      exclude_fields: "embedding,description",
    },
  ]);
  const cards = (res?.hits ?? []).map((h) => h.document as RawProduct).filter((d) => d.image_url).map((d) => toCard(d, 0, tax));
  return { brand: cards[0]?.brand ?? raw.brand, products: cards.slice(0, k) };
}
