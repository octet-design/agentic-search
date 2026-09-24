/** Deterministic "why" lines from matched attributes, used before/without the LLM rerank (brief §6.6). */
import { priceLabel } from "./chips";
import type { TaxonomyApi } from "./taxonomy";
import type { Intent, ProductCard } from "./types";

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

export function deterministicReason(p: ProductCard, intent: Intent, tax: TaxonomyApi): { reason: string; matched: string[] } {
  const matched: string[] = [];
  const bits: string[] = [];
  const check = (field: "color" | "fabric" | "pattern" | "fit", raw: string | null, wanted: string[]) => {
    if (!raw) return;
    const ids = tax.classify(field, raw);
    const hit = wanted.find((w) => ids.includes(w));
    if (hit) {
      const label = tax.label(field, hit).split("/")[0].trim();
      matched.push(label.toLowerCase());
      bits.push(cap(label));
    }
  };
  check("color", p.color, intent.colors.include);
  check("fabric", p.fabric, intent.fabrics.include);
  check("pattern", p.pattern, intent.patterns.include);
  check("fit", p.fit, intent.fits.include);
  const uc = p.useCase.flatMap((u) => tax.classify("useCase", u));
  const ucHit = intent.useCases.include.find((u) => uc.includes(u));
  if (ucHit) matched.push(tax.label("useCase", ucHit).toLowerCase());

  if (intent.price?.max && p.price <= intent.price.max) matched.push(priceLabel(null, intent.price.max)!.toLowerCase());
  for (const t of intent.textExclusions.slice(0, 1)) matched.push(`no ${t}`);
  for (const id of intent.fabrics.exclude.slice(0, 1)) matched.push(`no ${tax.label("fabric", id).split("/")[0].trim().toLowerCase()}`);

  // Fall back to the product's own attributes so every card has a factual line.
  if (!bits.length) {
    if (p.color) bits.push(cap(p.color));
    if (p.fabric) bits.push(cap(p.fabric));
    else if (p.pattern && p.pattern !== "solid") bits.push(cap(p.pattern));
  }
  bits.push(inr(p.price));
  return { reason: bits.slice(0, 4).join(" · "), matched: [...new Set(matched)].slice(0, 3) };
}
