/**
 * Server side of blending Shopify into Typesense search: Shopify Global Catalog lookups shaped as catalog
 * ProductCards (India, INR, fashion only). Every call fails soft: Shopify is additive, never a blocker.
 */
import type { Intent, ProductCard } from "./agent/types";
import { fromShopify, isShopifyId, shopifyIdOf, withAudience } from "./blend";
import { getProduct } from "./shopify/client";
import { getCountry } from "./shopify/countries";
import { money, similarQuery } from "./shopify/format";
import { searchFashion } from "./shopify/search";
import { toProductView } from "./shopify/view";

const INDIA = getCountry("IN");

/** Shopify products for a chat section: same need, same budget. Blend search passes the item's name as the query. */
export async function shopifyForSection(opts: { query: string; audience: Intent["audience"]; min?: number | null; max?: number | null; limit?: number; signal?: AbortSignal }): Promise<ProductCard[]> {
  try {
    const page = await searchFashion({ query: withAudience(opts.query, opts.audience), min: opts.min ?? null, max: opts.max ?? null, local: false }, INDIA, { limit: opts.limit ?? 8, signal: opts.signal });
    return page.products.map(fromShopify);
  } catch {
    return [];
  }
}

/** Shopify look-alikes: by product for a Shopify product, by title words for a catalog one. */
export async function shopifyLike(target: { id: string; title: string }, opts: { max?: number | null; limit?: number; signal?: AbortSignal } = {}): Promise<ProductCard[]> {
  try {
    const spec = isShopifyId(target.id)
      ? { query: "", like: shopifyIdOf(target.id), min: null, max: opts.max ?? null, local: false }
      : { query: similarQuery(target.title), min: null, max: opts.max ?? null, local: false };
    if (!spec.query && !("like" in spec && spec.like)) return [];
    const page = await searchFashion(spec, INDIA, { limit: opts.limit ?? 8, exclude: new Set([shopifyIdOf(target.id)]), signal: opts.signal });
    return page.products.map(fromShopify);
  } catch {
    return [];
  }
}

/** One line of facts about a Shopify product, for answering questions about it (live from Shopify). */
export async function shopifyFacts(id: string, signal?: AbortSignal): Promise<string | null> {
  try {
    const p = await getProduct(shopifyIdOf(id), [], { country: INDIA.code, currency: INDIA.currency, signal });
    if (!p) return null;
    const v = toProductView(shopifyIdOf(id), p);
    return [
      v.price ? `price ${money(v.price, INDIA.locale)}` : null,
      `store ${v.seller.name ?? "?"}`,
      v.rating ? `rating ${v.rating.value}/5 (${v.rating.count ?? "?"} reviews)` : null,
      v.options.length ? `options ${v.options.map((o) => `${o.name}: ${o.values.map((x) => (x.available ? x.label : `${x.label} (sold out)`)).slice(0, 10).join("/")}`).join("; ")}` : null,
      v.highlights.length ? `highlights ${v.highlights.slice(0, 4).join("; ")}` : null,
      v.specs.length ? `specs ${v.specs.slice(0, 6).join("; ")}` : null,
      v.seller.policies.length ? `policies listed: ${v.seller.policies.map((x) => x.label).join(", ")}` : null,
      (v.description ?? "").slice(0, 240),
    ]
      .filter(Boolean)
      .join(" | ");
  } catch {
    return null;
  }
}
