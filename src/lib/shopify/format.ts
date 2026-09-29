import type { Money } from "./types";

/** UCP prices are integers in minor units ({ amount: 249900, currency: "INR" } is ₹2,499). */
export function money(m: Money, locale = "en-IN"): string {
  try {
    const fmt = new Intl.NumberFormat(locale, { style: "currency", currency: m.currency });
    const digits = fmt.resolvedOptions().maximumFractionDigits ?? 2;
    const major = m.amount / 10 ** digits;
    // Drop ".00" on whole amounts; keep real paise/cents.
    return Number.isInteger(major)
      ? new Intl.NumberFormat(locale, { style: "currency", currency: m.currency, maximumFractionDigits: 0 }).format(major)
      : fmt.format(major);
  } catch {
    return `${m.currency} ${(m.amount / 100).toFixed(2)}`;
  }
}

/** /shopify/p/<id> with the chosen options as query params (?Size=M&Color=White). */
export function shopifyProductHref(id: string, selected: { name: string; label: string }[] = []): string {
  const qs = new URLSearchParams(selected.map((s) => [s.name, s.label])).toString();
  return `/shopify/p/${encodeURIComponent(id)}${qs ? `?${qs}` : ""}`;
}
