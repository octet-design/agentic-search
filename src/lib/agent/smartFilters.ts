/** Smart filters from the main rail's facets (brief §9.2): canonical labels, only dimensions that vary. */
import type { TaxonomyApi } from "./taxonomy";
import type { FacetField } from "./taxonomy.schema";
import type { ConstraintField, Intent, ProductCard, SmartFilter } from "./types";

const FIELDS: { tf: FacetField; field: ConstraintField; label: string; values: (p: ProductCard) => (string | null)[] }[] = [
  { tf: "color", field: "colors", label: "Colour", values: (p) => [p.color] },
  { tf: "fabric", field: "fabrics", label: "Fabric", values: (p) => [p.fabric] },
  { tf: "pattern", field: "patterns", label: "Pattern", values: (p) => [p.pattern] },
  { tf: "fit", field: "fits", label: "Fit", values: (p) => [p.fit] },
  { tf: "useCase", field: "useCases", label: "Occasion", values: (p) => p.useCase },
  { tf: "brand", field: "brands", label: "Brand", values: (p) => [p.brand] },
];

/** Built from the curated result pool (not Typesense facets): cheaper, and it reflects what's shown. */
export function smartFilters(products: ProductCard[], intent: Intent, tax: TaxonomyApi): SmartFilter[] {
  const out: SmartFilter[] = [];
  for (const f of FIELDS) {
    const agg = new Map<string, number>();
    for (const p of products) {
      const ids = new Set(f.values(p).flatMap((v) => (v ? tax.classify(f.tf, v).slice(0, 1) : [])));
      for (const id of ids) agg.set(id, (agg.get(id) ?? 0) + 1);
    }
    const already = new Set([...intent[f.field].include, ...intent[f.field].exclude]);
    const options = [...agg.entries()]
      .filter(([id]) => !already.has(id))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([id, count]) => ({ id, label: tax.label(f.tf, id), count }));
    if (options.length >= 2) out.push({ field: f.field, label: f.label, options });
  }
  const price = priceBuckets(products.map((p) => p.price));
  if (price) out.unshift(price);
  return out;
}

const roundNice = (n: number) => {
  if (n < 1000) return Math.round(n / 100) * 100 || 100;
  if (n < 10000) return Math.round(n / 500) * 500;
  return Math.round(n / 1000) * 1000;
};

/** Three price buckets from the result distribution (terciles, rounded to friendly numbers). */
export function priceBuckets(prices: number[]): SmartFilter | null {
  if (prices.length < 6) return null;
  const s = [...prices].sort((a, b) => a - b);
  const q = (p: number) => s[Math.min(s.length - 1, Math.floor(p * s.length))];
  const a = roundNice(q(1 / 3));
  const b = roundNice(q(2 / 3));
  if (a >= b) return null;
  const n = (lo: number, hi: number) => s.filter((x) => x >= lo && x <= hi).length;
  const fmt = (x: number) => `₹${x.toLocaleString("en-IN")}`;
  return {
    field: "price",
    label: "Price",
    options: [
      { id: `0-${a}`, label: `Under ${fmt(a)}`, count: n(0, a), max: a },
      { id: `${a}-${b}`, label: `${fmt(a)}–${fmt(b)}`, count: n(a, b), min: a, max: b },
      { id: `${b}-`, label: `Above ${fmt(b)}`, count: n(b, Infinity), min: b },
    ],
  };
}
