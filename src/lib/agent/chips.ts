/** Chips derived deterministically from the Intent (brief §6.1), plus chip removal. Pure. */
import type { TaxonomyApi } from "./taxonomy";
import { CONSTRAINT_FIELDS, TAXONOMY_FIELD, type Chip, type ConstraintField, type Intent } from "./types";

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

export function priceLabel(min: number | null, max: number | null): string | null {
  if (min && max) return `${inr(min)}–${inr(max)}`;
  if (max) return `Under ${inr(max)}`;
  if (min) return `Above ${inr(min)}`;
  return null;
}

function audienceLabel(i: Intent): string | null {
  const a = i.audience;
  if (a.segment === "unknown") return null;
  if (a.segment === "kids") {
    const who = a.kidGender === "girl" ? "Girls" : a.kidGender === "boy" ? "Boys" : "Kids";
    return a.ageYears != null ? `${who} · ${a.ageYears}y` : who;
  }
  return a.segment[0].toUpperCase() + a.segment.slice(1);
}

export function deriveChips(i: Intent, tax: TaxonomyApi): Chip[] {
  const chips: Chip[] = [];
  const aud = audienceLabel(i);
  if (aud) chips.push({ key: "audience", kind: "audience", label: aud, field: "audience" });
  for (const f of CONSTRAINT_FIELDS) {
    const c = i[f];
    const tf = TAXONOMY_FIELD[f];
    for (const id of c.include) {
      const label = tax.label(tf, id);
      chips.push(
        c.strength === "must" || f === "categories"
          ? { key: `${f}:include:${id}`, kind: "include", label, field: f, value: id }
          : { key: `${f}:include:${id}`, kind: "soft", label: `~ ${label}`, field: f, value: id },
      );
    }
    for (const id of c.exclude) {
      chips.push({ key: `${f}:exclude:${id}`, kind: "exclude", label: `✕ ${tax.label(tf, id)}`, field: f, value: id });
    }
  }
  if (i.price) {
    const label = priceLabel(i.price.min, i.price.max);
    if (label) chips.push({ key: "price", kind: i.price.strength === "must" ? "price" : "soft", label: i.price.strength === "must" ? label : `~ ${label}`, field: "price" });
  }
  if (i.sizes?.values.length && i.sizes.strength === "must") {
    chips.push({ key: "sizes", kind: "size", label: `Size ${i.sizes.values.join("/")}`, field: "sizes" });
  }
  for (const k of i.mustKeywords) chips.push({ key: `mustKeywords:${k}`, kind: "keyword", label: `“${k}”`, field: "mustKeywords", value: k });
  for (const t of i.textExclusions) chips.push({ key: `textExclusions:${t}`, kind: "exclude", label: `✕ ${t}`, field: "textExclusions", value: t });
  for (const s of i.softPreferences) chips.push({ key: `softPreferences:${s}`, kind: "soft", label: `~ ${s}`, field: "softPreferences", value: s });
  return chips;
}

/** Returns a copy of the intent without the chip's constraint. */
export function removeChip(i: Intent, key: string): Intent {
  const next = structuredClone(i);
  if (key === "audience") {
    next.audience = { segment: "unknown", kidGender: null, ageYears: null, source: "unknown" };
    return next;
  }
  if (key === "price") {
    next.price = null;
    return next;
  }
  if (key === "sizes") {
    next.sizes = null;
    return next;
  }
  const [field, ...rest] = key.split(":");
  if (field === "mustKeywords" || field === "textExclusions" || field === "softPreferences") {
    const value = rest.join(":");
    next[field] = next[field].filter((v) => v !== value);
    return next;
  }
  if ((CONSTRAINT_FIELDS as readonly string[]).includes(field)) {
    const [side, id] = rest as ["include" | "exclude", string];
    const f = field as ConstraintField;
    next[f] = { ...next[f], [side]: next[f][side].filter((v) => v !== id) };
  }
  return next;
}
