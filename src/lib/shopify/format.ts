import type { Money } from "./types";

const fractionDigits = (currency: string) => {
  try {
    return new Intl.NumberFormat("en", { style: "currency", currency }).resolvedOptions().maximumFractionDigits ?? 2;
  } catch {
    return 2;
  }
};

/** UCP prices are integers in minor units ({ amount: 249900, currency: "INR" } is ₹2,499). */
export function money(m: Money, locale = "en-IN"): string {
  try {
    const major = m.amount / 10 ** fractionDigits(m.currency);
    // Drop ".00" on whole amounts; keep real paise/cents.
    return new Intl.NumberFormat(locale, { style: "currency", currency: m.currency, ...(Number.isInteger(major) ? { maximumFractionDigits: 0 } : {}) }).format(major);
  } catch {
    return `${m.currency} ${(m.amount / 100).toFixed(2)}`;
  }
}

/** Whole currency units → UCP minor units (₹2,500 → 250000; ¥1,500 → 1500). */
export const toMinor = (major: number, currency: string) => Math.round(major * 10 ** fractionDigits(currency));

/** Query key that carries the buyer country on product links; never a product option. */
export const COUNTRY_PARAM = "country";

/** /shopify/p/<id> with the chosen options as query params (?Size=M&Color=White), plus the buyer country. */
export function shopifyProductHref(id: string, selected: { name: string; label: string }[] = [], country?: string): string {
  const qs = new URLSearchParams(selected.filter((s) => s.name !== COUNTRY_PARAM).map((s) => [s.name, s.label]));
  if (country) qs.set(COUNTRY_PARAM, country);
  const q = qs.toString();
  return `/shopify/p/${encodeURIComponent(id)}${q ? `?${q}` : ""}`;
}

/** "Women's Mul Shiffon Kurti - R1138" → "women's mul shiffon kurti": a query for look-alikes from other stores. */
export const similarQuery = (title: string) =>
  title
    .toLowerCase()
    .replace(/\b[a-z]*\d[\w-]*\b/g, " ")
    .replace(/[^\p{L}' ]+/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1)
    .slice(0, 5)
    .join(" ");
