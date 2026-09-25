/**
 * Post-retrieval checks (brief §6.5). Typesense filters use only the most common raw values
 * (long lists are slow), so every hit is re-checked here against the full taxonomy + text rules.
 * An exclusion is never allowed through.
 */
import type { TaxonomyApi } from "./taxonomy";
import type { FacetField } from "./taxonomy.schema";
import { CONSTRAINT_FIELDS, TAXONOMY_FIELD, type Intent, type RawProduct } from "./types";

const PRODUCT_FIELD: Record<FacetField, keyof RawProduct> = {
  category: "category",
  color: "color",
  fabric: "fabric",
  pattern: "pattern",
  fit: "fit",
  useCase: "use_case",
  brand: "brand",
};

/** Hand-written synonyms for common non-facet exclusions. */
const TEXT_SYNONYMS: [RegExp, string][] = [
  [/^cut[\s-]*outs?$/, "cut[\\s-]*outs?"],
  [/^sleeveless$/, "sleeve[\\s-]*less"],
  [/^sheer$/, "sheer|see[\\s-]*through|transparent"],
  [/^(slit|slits)$/, "slits?|slitted"],
  [/^backless$/, "back[\\s-]*less|open[\\s-]*back"],
  [/^heavy (embroidery|work)$/, "heav(y|ily)[\\s-]*(embroider(y|ed)|work)"],
  [/^deep neck$/, "deep[\\s-]*(v[\\s-]*)?neck|plung(e|ing)"],
  [/^crop(ped)?( tops?)?$/, "crop(ped)?"],
  [/^strapless$/, "strap[\\s-]*less|tube"],
  [/^off[\s-]*shoulder$/, "off[\\s-]*(the[\\s-]*)?shoulders?"],
  [/^(ripped|distressed)$/, "ripped|distressed"],
  [/^(embellished|sequins?|sequined)$/, "sequin(s|ned|ed)?|embellish(ed|ment)"],
];

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Word-boundary regex for a user phrase, tolerant to hyphens/spaces and plurals. */
export function phraseRegex(phrase: string): RegExp | null {
  const p = phrase.trim().toLowerCase().replace(/^(no|not|without|avoid)\s+/, "");
  if (!p) return null;
  for (const [match, source] of TEXT_SYNONYMS) if (match.test(p)) return new RegExp(`\\b(${source})\\b`, "i");
  const words = p.split(/[\s-]+/).filter(Boolean).map(escapeRe);
  if (!words.length) return null;
  const last = words.length - 1;
  words[last] = `${words[last]}(s|es)?`;
  return new RegExp(`\\b${words.join("[\\s-]*")}\\b`, "i");
}

/** Kids' products by title: "Kids", "Baby", "Girls'/Boys' …", age ranges like "(0-5 Yrs)", "6-7Y". */
export const KIDS_TITLE = /\b(kids?|baby|babies|infants?|toddlers?|new ?born|girls'?|boys'?)\b|\b\d{1,2}\s*-\s*\d{1,2}\s*(yrs?|years?|y|m|months?)\b/i;

export type Checker = {
  /** Reasons this product violates the intent (exclusions, text rules); empty = OK. */
  violations(p: RawProduct): string[];
  /** Hard requirements the product doesn't meet (must includes, audience, price, sizes); empty = OK. */
  unmet(p: RawProduct): string[];
};

export function makeChecker(intent: Intent, tax: TaxonomyApi): Checker {
  const facetExcludes = CONSTRAINT_FIELDS.map((f) => ({
    field: TAXONOMY_FIELD[f],
    ids: new Set(intent[f].exclude.filter((id) => tax.has(TAXONOMY_FIELD[f], id))),
  })).filter((x) => x.ids.size);

  // Excluded colours/fabrics named in the title count too ("Red Floral Dress" with color=multi).
  const titleWords: { label: string; re: RegExp }[] = [];
  for (const { field, ids } of facetExcludes) {
    if (field !== "color" && field !== "fabric") continue;
    for (const id of ids) {
      const fam = tax.families(field).find((f) => f.id === id);
      const kws = [id.replace(/-/g, " "), ...(fam?.keywords ?? [])].filter((k) => k.length >= 3);
      if (kws.length) titleWords.push({ label: `${field}:${id}`, re: new RegExp(`\\b(${kws.map(escapeRe).join("|")})\\b`, "i") });
    }
  }

  const musts = CONSTRAINT_FIELDS.filter((f) => intent[f].strength === "must")
    .map((f) => ({ field: TAXONOMY_FIELD[f], ids: new Set(intent[f].include.filter((id) => tax.has(TAXONOMY_FIELD[f], id))) }))
    .filter((x) => x.ids.size);
  const genders = new Set(
    tax.audienceGenders({ segment: intent.audience.segment, kidGender: intent.audience.kidGender, ageYears: intent.audience.ageYears }),
  );
  const adult = intent.audience.segment === "women" || intent.audience.segment === "men";
  const price = intent.price?.strength === "must" ? intent.price : null;
  const sizes = intent.sizes?.strength === "must" ? new Set(intent.sizes.values.map((v) => v.toLowerCase())) : null;

  const textRes = intent.textExclusions.map((t) => ({ t, re: phraseRegex(t) })).filter((x) => x.re);
  const mustRes = intent.mustKeywords.map((k) => ({ k, re: phraseRegex(k) })).filter((x) => x.re);

  return {
    violations(p) {
      const out: string[] = [];
      for (const { field, ids } of facetExcludes) {
        const raw = p[PRODUCT_FIELD[field]];
        const values = Array.isArray(raw) ? raw : raw ? [String(raw)] : [];
        for (const v of values) {
          const hit = tax.classify(field, v).find((id) => ids.has(id));
          if (hit) out.push(`${field}:${hit}`);
        }
      }
      for (const w of titleWords) if (w.re.test(p.title)) out.push(`title:${w.label}`);
      // Some kids' items carry an adult gender in the catalog; their titles give them away (both search legs).
      if (adult && KIDS_TITLE.test(p.title)) out.push("audience:kids-title");
      const text = `${p.title} ${p.description ?? ""}`;
      for (const { t, re } of textRes) if (re!.test(text)) out.push(`text:${t}`);
      for (const { k, re } of mustRes) if (!re!.test(text)) out.push(`missing:${k}`);
      return [...new Set(out)];
    },
    unmet(p) {
      const out: string[] = [];
      if (genders.size && !genders.has(p.gender)) out.push("audience");
      for (const { field, ids } of musts) {
        const raw = p[PRODUCT_FIELD[field]];
        const values = Array.isArray(raw) ? raw : raw ? [String(raw)] : [];
        // classify() returns a category's ancestors too, so a "dress" must accepts maxi dresses.
        if (!values.some((v) => tax.classify(field, v).some((id) => ids.has(id)))) out.push(`must:${field}`);
      }
      if (price && ((price.max != null && p.price > price.max) || (price.min != null && p.price < price.min))) out.push("price");
      if (sizes && !(p.sizes ?? []).some((s) => sizes.has(s.trim().toLowerCase()))) out.push("size");
      return out;
    },
  };
}
