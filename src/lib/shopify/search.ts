import { searchCatalog } from "./client";
import { FASHION_CATEGORIES } from "./config";
import type { Country } from "./countries";
import { toMinor } from "./format";
import type { ShopifyPage } from "./types";

/** Hard stop for obviously non-fashion searches (the agent's prompt forbids them, but the model sometimes still tries; the grid has no agent). */
const NON_FASHION =
  /\b(head ?phones?|ear ?(buds?|phones?)|speakers?|airpods|smart ?phones?|mobile phones?|iphones?|laptops?|tablets?|chargers?|cables?|tv|television|cameras?|consoles?|gaming|mugs?|kitchen|cookware|utensils?|plates?|sofa|furniture|mattress|bedsheets?|pillows?|lamps?|decor|candles?|perfumes?|fragrances?|colognes?|skin ?care|serums?|moisturi[sz]ers?|sunscreen|shampoo|conditioner|make ?up|lipsticks?|nail polish|toys?|books?|supplements?|protein|vitamins?|food|snacks?|coffee (beans|maker|machine)|pet (food|toys?))\b/i;
export const isNonFashionQuery = (q: string) => NON_FASHION.test(q);

/** What a product row searched for, in whole units of the buyer's currency. "See all" re-runs it as-is. */
export type SearchSpec = { query: string; min: number | null; max: number | null; local: boolean };

/**
 * Fashion search for one country: only stores that deliver there, only prices in its currency,
 * and the budget enforced here too (Shopify converts budgets via FX, so its filter is approximate).
 */
export async function searchFashion(
  spec: SearchSpec,
  country: Country,
  opts: { limit?: number; cursor?: string | null; exclude?: Set<string>; signal?: AbortSignal } = {},
): Promise<ShopifyPage> {
  const cur = country.currency;
  const min = spec.min != null ? toMinor(spec.min, cur) : undefined;
  const max = spec.max != null ? toMinor(spec.max, cur) : undefined;
  const page = await searchCatalog(spec.query, {
    country: country.code,
    currency: cur,
    limit: opts.limit ?? 20,
    cursor: opts.cursor,
    price: { min, max },
    shipsFrom: spec.local ? [country.code] : undefined,
    categories: FASHION_CATEGORIES,
    signal: opts.signal,
  });
  return {
    ...page,
    products: page.products.filter(
      (c) =>
        !opts.exclude?.has(c.id) &&
        (!c.price || (c.price.currency === cur && (min == null || c.price.amount >= min) && (max == null || c.price.amount <= max))),
    ),
  };
}
