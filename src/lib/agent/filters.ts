/** Pure helpers for building Typesense `filter_by` strings. */

/** Items below this price are beauty/consumable noise (see docs/catalog-notes.md). */
export const PRICE_FLOOR = 50;

/** Wraps a value in backticks, escaping backslashes and backticks inside (both verified on Typesense v30.2). */
export function escapeFilterValue(value: string): string {
  return "`" + value.replace(/\\/g, "\\\\").replace(/`/g, "\\`") + "`";
}

/** `field:=[…]`, or null when there are no values (callers drop nulls). */
export function inFilter(field: string, values: readonly string[]): string | null {
  if (!values.length) return null;
  return `${field}:=[${values.map(escapeFilterValue).join(",")}]`;
}

/** `field:!=[…]`, or null when there are no values. */
export function notInFilter(field: string, values: readonly string[]): string | null {
  if (!values.length) return null;
  return `${field}:!=[${values.map(escapeFilterValue).join(",")}]`;
}

export function andFilters(...parts: (string | null | undefined | false)[]): string {
  return parts.filter((p): p is string => typeof p === "string" && p.length > 0).join(" && ");
}

/** Price range clause; open ends use `>=` / `<=`. Null when neither bound is set. */
export function priceFilter(min: number | null | undefined, max: number | null | undefined): string | null {
  const lo = min != null && min > 0 ? Math.floor(min) : null;
  const hi = max != null && max > 0 ? Math.ceil(max) : null;
  if (lo != null && hi != null) return `price:[${Math.min(lo, hi)}..${Math.max(lo, hi)}]`;
  if (hi != null) return `price:<=${hi}`;
  if (lo != null) return `price:>=${lo}`;
  return null;
}

export type BaseFilterInput = {
  excludedGenders: readonly string[];
  excludedCategoryValues: readonly string[];
};

/**
 * Applied to every product query: in stock, not deactivated, a fashion item, not price noise.
 * Missing `is_active` counts as active (`!=false` keeps those 172 docs).
 */
export function baseFilter(input: BaseFilterInput): string {
  return andFilters(
    "in_stock:true",
    "is_active:!=false",
    notInFilter("gender", input.excludedGenders),
    notInFilter("category", input.excludedCategoryValues),
    `price:>=${PRICE_FLOOR}`,
  );
}
