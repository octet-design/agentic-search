/**
 * Aura's "For you" feed: a Pinterest-style stream mixed from what the shopper did (products they saved or opened →
 * look-alikes, recent searches, brands they liked) and curated fashion queries for their country (cold start and
 * variety). Each source pages independently; one opaque cursor carries all their positions.
 */
import type { Country } from "./countries";
import { searchFashion, type SearchSpec } from "./search";
import type { ShopifyCard } from "./types";

export type FeedSeeds = {
  products: { id: string; title: string }[];
  queries: string[];
  brands: { id: string; name: string }[];
};
export type FeedItem = ShopifyCard & { reason: string | null };
export type FeedPage = { items: FeedItem[]; cursor: string | null };

/** Concrete queries (abstract ones like "new arrivals" don't search well). Unisex mix, India adds ethnic wear. */
const CURATED_COMMON = [
  "linen co-ord set women",
  "white leather sneakers",
  "oversized shirt men",
  "floral midi dress",
  "block heel sandals women",
  "denim jacket",
  "leather tote bag",
  "linen trousers men",
  "printed maxi dress",
  "minimal watch",
  "straight fit jeans women",
  "knit polo men",
  "satin slip dress",
  "gold hoop earrings",
  "chelsea boots men",
  "crossbody bag women",
];
const CURATED_IN = ["cotton kurta set women", "chikankari kurta", "men kurta pyjama set", "silk saree", "gold jhumka earrings", "juttis women"];

export function curatedFor(country: Country): string[] {
  // Interleave so ethnic picks are spread through the feed rather than bunched.
  if (country.code !== "IN") return CURATED_COMMON;
  const out: string[] = [];
  CURATED_COMMON.forEach((q, i) => {
    out.push(q);
    if (i % 3 === 1 && CURATED_IN[Math.floor(i / 3)]) out.push(CURATED_IN[Math.floor(i / 3)]);
  });
  return [...out, ...CURATED_IN.filter((q) => !out.includes(q))];
}

type Source = { key: string; spec: SearchSpec; reason: string | null };
/** Per-source next cursor ("" = not started, false = exhausted) and where the curated rotation is. */
type CursorState = { s: Record<string, string | false>; c: number };

const encode = (c: CursorState) => Buffer.from(JSON.stringify(c)).toString("base64url");
function decode(raw: string | null | undefined): CursorState {
  if (!raw) return { s: {}, c: 0 };
  try {
    const v = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as CursorState;
    return v && typeof v.c === "number" && typeof v.s === "object" ? v : { s: {}, c: 0 };
  } catch {
    return { s: {}, c: 0 };
  }
}

const spec = (p: Partial<SearchSpec>): SearchSpec => ({ query: "", min: null, max: null, local: false, ...p });

export function seedSources(seeds: FeedSeeds): Source[] {
  return [
    ...seeds.products.slice(0, 3).map((p) => ({ key: `p:${p.id}`, spec: spec({ like: p.id }), reason: `Because you liked ${p.title.slice(0, 40)}` })),
    ...seeds.queries.slice(0, 3).map((q) => ({ key: `q:${q.toLowerCase()}`, spec: spec({ query: q }), reason: `From your search “${q.slice(0, 40)}”` })),
    ...seeds.brands.slice(0, 2).map((b) => ({ key: `b:${b.id}`, spec: spec({ query: "clothing", shop: b.id }), reason: `More from ${b.name}` })),
  ];
}

/** Round-robin merge, dropping repeats and excluded ids; keeps each item's source reason. */
export function interleave(lists: FeedItem[][], exclude: Set<string>): FeedItem[] {
  const out: FeedItem[] = [];
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

// 10-minute cache per (country, source, cursor): the feed is the most-repeated call and Shopify rate-limits.
const cache = new Map<string, { at: number; v: { items: ShopifyCard[]; next: string | false } }>();
const TTL = 10 * 60_000;
async function fetchSource(src: Source, country: Country, cursor: string, signal?: AbortSignal) {
  const key = `${country.code}|${src.spec.local ? "local" : "any"}|${src.key}|${cursor}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.v;
  const page = await searchFashion(src.spec, country, { limit: 10, cursor: cursor || null, signal });
  const v = { items: page.products, next: page.hasNext && page.cursor ? page.cursor : (false as const) };
  if (cache.size > 2000) cache.delete(cache.keys().next().value!);
  cache.set(key, { at: Date.now(), v });
  return v;
}

const CURATED_PER_PAGE = 3;

/** `local`: only products shipped from the buyer's country (Scout's local-sellers rule). */
export async function feedPage(opts: { country: Country; seeds: FeedSeeds; cursor?: string | null; exclude?: string[]; local?: boolean; signal?: AbortSignal }): Promise<FeedPage> {
  const state = decode(opts.cursor);
  const curated = curatedFor(opts.country);
  const fromCurated: Source[] = Array.from({ length: CURATED_PER_PAGE }, (_, i) => {
    const q = curated[(state.c + i) % curated.length];
    return { key: `c:${q}`, spec: spec({ query: q }), reason: null };
  });
  const sources = [...seedSources(opts.seeds), ...fromCurated]
    .filter((s) => state.s[s.key] !== false)
    .map((s) => (opts.local ? { ...s, spec: { ...s.spec, local: true } } : s));

  const results = await Promise.all(
    sources.map((src) =>
      fetchSource(src, opts.country, (state.s[src.key] as string | undefined) ?? "", opts.signal)
        .then((r) => ({ src, ...r, failed: false }))
        .catch((err) => {
          console.warn(`[aura] feed source ${src.key} failed:`, err instanceof Error ? err.message : err);
          return { src, items: [] as ShopifyCard[], next: false as const, failed: true };
        }),
    ),
  );

  const next: CursorState = { s: { ...state.s }, c: (state.c + CURATED_PER_PAGE) % Math.max(curated.length, 1) };
  // A failed source (e.g. rate-limited) keeps its position and is retried on the next page.
  for (const r of results) if (!r.failed) next.s[r.src.key] = r.next;
  const items = interleave(
    results.map((r) => r.items.map((p) => ({ ...p, reason: r.src.reason }))),
    new Set(opts.exclude ?? []),
  );
  // Curated queries rotate forever, so there is always a next page.
  return { items, cursor: encode(next) };
}
