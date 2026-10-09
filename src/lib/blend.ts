/**
 * Blending Shopify Global Catalog products into Typesense search (client- and server-safe, no server imports).
 * Shopify products become ordinary ProductCards with `source: "shopify"` and an id prefixed so they never
 * collide with catalog ids.
 */
import type { Intent, ProductCard } from "./agent/types";
import type { ShopifyCard } from "./shopify/types";

export const SHOPIFY_PREFIX = "shopify-";
export const isShopifyId = (id: string) => id.startsWith(SHOPIFY_PREFIX);
/** "shopify-AbC123" → "AbC123" (the Shopify product id the shopify APIs take). */
export const shopifyIdOf = (id: string) => id.slice(SHOPIFY_PREFIX.length);

const major = (m: { amount: number; currency: string }) => {
  const digits = new Intl.NumberFormat("en", { style: "currency", currency: m.currency }).resolvedOptions().maximumFractionDigits ?? 2;
  return m.amount / 10 ** digits;
};
const hostOf = (url: string | null) => {
  try {
    return url ? new URL(url).hostname.replace(/^www\./, "") : "";
  } catch {
    return "";
  }
};

export function fromShopify(c: ShopifyCard): ProductCard {
  const url = c.url ?? c.checkoutUrl ?? "";
  return {
    id: SHOPIFY_PREFIX + c.id,
    title: c.title,
    brand: c.seller ?? "Shopify store",
    category: "",
    gender: "",
    color: "",
    fabric: null,
    fit: null,
    pattern: null,
    useCase: [],
    price: c.price ? Math.round(major(c.price)) : 0,
    ...(c.listPrice && c.price && c.listPrice.amount > c.price.amount ? { listPrice: Math.round(major(c.listPrice)) } : {}),
    sizes: [],
    image: c.image,
    url,
    domain: hostOf(url),
    reason: "",
    matched: [],
    score: 0,
    source: "shopify",
    checkoutUrl: c.checkoutUrl,
    ...(c.priceApprox ? { priceApprox: true } : {}),
    // Highlights and options also count when checking for an exact match (lib/relevance.ts).
    extraText: [...c.features, c.defaultOptions ?? ""].filter(Boolean).join(" · "),
  };
}

/**
 * Interleaves catalog and Shopify results: `every` catalog items, then one Shopify item, repeating; leftovers
 * follow. Catalog stays the backbone; Shopify adds range.
 */
export function blend<T extends { id: string }>(catalog: T[], shopify: T[], every = 2): T[] {
  const out: T[] = [];
  const seen = new Set<string>();
  const push = (x: T | undefined) => x && !seen.has(x.id) && (seen.add(x.id), out.push(x));
  let i = 0;
  let j = 0;
  while (i < catalog.length || j < shopify.length) {
    for (let k = 0; k < every && i < catalog.length; k++) push(catalog[i++]);
    if (j < shopify.length) push(shopify[j++]);
    if (i >= catalog.length) while (j < shopify.length) push(shopify[j++]);
  }
  return out;
}

/** Adds who it's for when the query doesn't say ("linen shirt" → "linen shirt men"). */
export function withAudience(query: string, audience: Intent["audience"]): string {
  const word = audience.segment === "women" ? "women" : audience.segment === "men" ? "men" : audience.segment === "kids" ? (audience.kidGender === "boy" ? "boys" : audience.kidGender === "girl" ? "girls" : "kids") : null;
  if (!word || new RegExp(`\\b(${word}|womens?|mens?|ladies|girls?|boys?|kids?)\\b`, "i").test(query)) return query;
  return `${query} ${word}`;
}
