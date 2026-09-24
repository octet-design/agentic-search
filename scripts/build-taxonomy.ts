/**
 * Milestone 1: raw facet values → canonical taxonomy.
 *
 * Reads data/raw-facets/*.json (from `npm run discover`), clusters values with OPENAI_MODEL_OFFLINE,
 * and writes:
 *   data/taxonomy.families.json canonical families (ids, labels, departments, parents). Proposed by the
 *                               LLM on the first run, then reused as-is: edit it by hand, or pass
 *                               --repropose to regenerate. The live catalog makes proposals drift.
 *   data/taxonomy.json          canonical concepts ⇄ raw values (committed; loaded by src/lib/agent/taxonomy.ts)
 *   data/taxonomy.review.md     low-confidence / unmapped values for a human to skim
 *
 * LLM responses are cached under .cache/llm, so re-runs only pay for changed prompts.
 * Usage: npm run build:taxonomy [-- --repropose]
 */
import { existsSync } from "node:fs";
import path from "node:path";
import { writeFile } from "node:fs/promises";
import { z } from "zod";
import { getEnv } from "../src/lib/env";
import { andFilters, baseFilter, inFilter } from "../src/lib/agent/filters";
import {
  AUDIENCES,
  DEPARTMENTS,
  DEPARTMENT_IDS,
  TaxonomySchema,
  type Audience,
  type Category,
  type DepartmentId,
  type Family,
  type Taxonomy,
} from "../src/lib/agent/taxonomy.schema";
import { ROOT, mapLimit, readJson, writeJson } from "./lib/io";
import { llmParse, usage } from "./lib/llm";
import { multiSearch, pricePercentiles, type PriceGroup } from "./lib/ts";

const MIN_COUNT = 5;
const BATCH = 150;
const RETRY_BATCH = 60;
const CONCURRENCY = 6;
const PROPOSAL_TOP_N = 400;
const FAMILIES_FILE = path.join(ROOT, "data", "taxonomy.families.json");

// From docs/catalog-notes.md (M0). Raw gender value → audience; null = not searchable.
const GENDER_MAP: Record<string, Audience | null> = {
  female: "women",
  male: "men",
  girl: "girls",
  boy: "boys",
  infant: "kids",
  unisex: "unisex",
  other: null,
  unidentified: null,
};

type RawValue = { value: string; count: number };
type Confidence = "high" | "medium" | "low";
type Assignment = { primary: string; also: string[]; confidence: Confidence };
type FamilyDef = { id: string; label: string; related: string[]; keywords: string[] };

const slug = (s: string) =>
  s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

async function loadFacet(field: string): Promise<RawValue[]> {
  const f = await readJson<{ values: RawValue[] }>(path.join(ROOT, "data", "raw-facets", `${field}.json`));
  return f.values;
}

/** Rounds counts to 2 significant digits so small live-catalog changes don't bust the LLM cache. */
const approx = (n: number) => (n < 100 ? String(n) : String(Number(n.toPrecision(2))));

const fmtValues = (vals: RawValue[]) => vals.map((v, i) => `${i}: ${v.value} (${v.count})`).join("\n");

// ---------------------------------------------------------------------------
// Fixed colour families (brief §6.2). Neighbours drive relaxation step 2.
// ---------------------------------------------------------------------------

const COLOR_FAMILIES: FamilyDef[] = [
  { id: "black", label: "Black", related: ["grey", "navy"], keywords: ["black", "jet"] },
  { id: "white", label: "White", related: ["off-white", "silver"], keywords: ["white"] },
  { id: "off-white", label: "Off-white / ivory / cream", related: ["white", "beige"], keywords: ["off white", "off-white", "ivory", "cream", "ecru", "pearl"] },
  { id: "beige", label: "Beige / nude", related: ["off-white", "brown"], keywords: ["beige", "nude", "khaki", "sand", "taupe", "fawn", "skin"] },
  { id: "brown", label: "Brown", related: ["beige", "orange", "maroon"], keywords: ["brown", "coffee", "chocolate", "tan", "camel", "mocha"] },
  { id: "grey", label: "Grey", related: ["black", "silver"], keywords: ["grey", "gray", "charcoal", "ash", "slate", "melange"] },
  { id: "navy", label: "Navy", related: ["blue", "black"], keywords: ["navy"] },
  { id: "blue", label: "Blue", related: ["navy", "light-blue", "teal"], keywords: ["blue", "indigo", "denim", "cobalt"] },
  { id: "light-blue", label: "Sky / light blue", related: ["blue", "white"], keywords: ["sky", "light blue", "powder blue", "baby blue", "ice blue"] },
  { id: "green", label: "Green", related: ["olive", "teal"], keywords: ["green", "emerald", "mint", "lime", "parrot"] },
  { id: "olive", label: "Olive", related: ["green", "brown"], keywords: ["olive", "army"] },
  { id: "teal", label: "Teal / turquoise", related: ["green", "blue"], keywords: ["teal", "turquoise", "aqua", "peacock"] },
  { id: "red", label: "Red", related: ["maroon", "pink", "orange"], keywords: ["red", "crimson", "scarlet", "cherry"] },
  { id: "maroon", label: "Maroon / wine", related: ["red", "purple", "brown"], keywords: ["maroon", "wine", "burgundy", "oxblood"] },
  { id: "pink", label: "Pink", related: ["pastel-pink", "red", "purple"], keywords: ["pink", "fuchsia", "magenta", "rani"] },
  { id: "pastel-pink", label: "Pastel / blush pink", related: ["pink", "peach"], keywords: ["baby pink", "blush", "pastel pink", "light pink", "dusty pink", "onion pink"] },
  { id: "peach", label: "Peach / coral", related: ["orange", "pastel-pink"], keywords: ["peach", "coral", "salmon", "apricot"] },
  { id: "orange", label: "Orange / rust", related: ["peach", "red", "yellow", "brown"], keywords: ["orange", "rust", "tangerine"] },
  { id: "yellow", label: "Yellow / mustard", related: ["gold", "orange"], keywords: ["yellow", "mustard", "lemon", "haldi", "ochre"] },
  { id: "purple", label: "Purple / lavender", related: ["maroon", "pink", "navy"], keywords: ["purple", "lavender", "lilac", "violet", "mauve", "plum"] },
  { id: "gold", label: "Gold", related: ["yellow", "beige"], keywords: ["gold", "golden", "copper", "bronze", "champagne"] },
  { id: "silver", label: "Silver / metallic", related: ["grey", "white"], keywords: ["silver", "metallic", "gunmetal", "oxidised", "oxidized"] },
  { id: "multicolor", label: "Multicolour", related: [], keywords: ["multi", "multicolor", "multicolour", "rainbow", "assorted"] },
];

// ---------------------------------------------------------------------------
// Human corrections applied after the LLM steps (from reviewing data/taxonomy.review.md)
// ---------------------------------------------------------------------------

type Merge = { into: string; from: string[]; label: string; keywords: string[] };

/** Families the model split that are the same material: "no lycra" must also exclude spandex. */
const FABRIC_MERGES: Merge[] = [
  { into: "elastane", from: ["spandex", "lycra"], label: "Elastane / Lycra / spandex", keywords: ["elastane", "lycra", "spandex"] },
  { into: "rayon", from: ["viscose"], label: "Rayon / viscose", keywords: ["rayon", "viscose"] },
  { into: "rayon-blend", from: ["viscose-blend"], label: "Rayon / viscose blend", keywords: ["rayon blend", "viscose blend"] },
];

/**
 * Parent links the model got too broad: a shopper asking for the parent wouldn't want these
 * ("trousers" ≠ jeans/shorts/leggings, "bag" ≠ wallet, "tie" ≠ cufflinks). null = top-level.
 */
const PARENT_OVERRIDES: Record<string, string | null> = {
  jeans: null,
  shorts: null,
  legging: null,
  capri: null,
  jogger: null,
  wallet: null,
  "pocket-square": null,
  cufflink: null,
  shrug: null,
  blazer: null,
  boxer: null,
  "hair-clip": null,
  scrunchie: null,
};

/** Individual raw values the model got wrong. */
const OVERRIDES: Partial<Record<"color" | "fabric" | "pattern" | "fit" | "useCase", Record<string, Assignment>>> = {
  // Fleece is almost always polyester; "no polyester" must catch it.
  fabric: { fleece: { primary: "polyester", also: [], confidence: "high" } },
};

function applyOverrides(field: keyof typeof OVERRIDES, assignments: Map<string, Assignment>, ids: Set<string>) {
  for (const [raw, a] of Object.entries(OVERRIDES[field] ?? {})) {
    if (assignments.has(raw) && ids.has(a.primary)) assignments.set(raw, a);
  }
}

/** Folds `from` families into `into` (created from the first `from` if missing) and remaps assignments. */
function applyMerges(defs: FamilyDef[], assignments: Map<string, Assignment>, merges: Merge[]): FamilyDef[] {
  let out = defs.map((d) => ({ ...d }));
  for (const m of merges) {
    const members = out.filter((d) => m.from.includes(d.id) || d.id === m.into);
    if (!members.length) continue;
    const target: FamilyDef = { id: m.into, label: m.label, related: [], keywords: [] };
    target.keywords = [...new Set([...m.keywords, ...members.flatMap((d) => d.keywords)])];
    target.related = [...new Set(members.flatMap((d) => d.related))];
    const firstIdx = out.findIndex((d) => members.includes(d));
    out = out.filter((d) => !members.includes(d));
    out.splice(Math.min(firstIdx, out.length), 0, target);
    const remap = (id: string) => (m.from.includes(id) ? m.into : id);
    for (const [raw, a] of assignments) {
      const primary = remap(a.primary);
      assignments.set(raw, { ...a, primary, also: [...new Set(a.also.map(remap))].filter((x) => x !== primary) });
    }
    for (const d of out) d.related = [...new Set(d.related.map(remap))].filter((r) => r !== d.id);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Prompts
// ---------------------------------------------------------------------------

const CONTEXT =
  "You are building the search taxonomy for an Indian fashion shopping assistant (women, men, kids; apparel, " +
  "footwear, bags, accessories, jewellery). Shoppers write in English, Hinglish or Hindi. Canonical ids are " +
  "lowercase kebab-case English (e.g. `kurta-set`, `off-white`, `cotton-blend`).";

const PROPOSAL_GUIDANCE: Record<"fabric" | "pattern" | "fit" | "useCase", string> = {
  fabric:
    "Propose 25–45 fabric/material families. Include non-textile materials that occur (leather, faux leather, " +
    "metals and plating for jewellery like brass/silver/alloy, rubber/EVA for footwear, canvas). Keep pure fibres " +
    "and blends separate when both are common (`cotton` vs `cotton-blend`) because shoppers ask for '100% cotton'. " +
    "Silk varieties (katan, banarasi, kanjeevaram) belong to `silk` unless very common and distinct. " +
    "`related`: 2–4 closest substitutes a stylist would offer if the fabric is unavailable (silk → satin, crepe).",
  pattern:
    "Propose 15–30 pattern/surface-technique families. Include Indian crafts that shoppers ask for by name " +
    "(bandhani, leheriya, ikat, block print, chikankari, kalamkari, zari/brocade, mirror work) when they occur. " +
    "`related`: 1–3 closest alternatives (floral → printed).",
  fit:
    "Propose 10–20 fit/silhouette families (regular, slim, skinny, relaxed, oversized, straight, tailored, a-line, " +
    "flared, bodycon, wide-leg, tapered, bootcut, flowy…). `related`: 1–3 closest fits (slim → skinny, tailored).",
  useCase:
    "Propose 15–25 occasion/use families that a shopper would filter by (casual, daily-wear, office, formal, party, " +
    "festive, wedding, gym, running, yoga, lounge, sleep, travel, beach, winter, evening, streetwear, school…). " +
    "Merge synonyms (sport/sports, gift/gifting, work/office wear). Do not create families for product types or " +
    "non-fashion uses. `related`: 1–3 nearby occasions (wedding → festive).",
};

const ASSIGN_GUIDANCE: Record<"category" | "color" | "fabric" | "pattern" | "fit" | "useCase", string> = {
  category:
    "Assign every raw category to exactly one canonical category (never `none`). Raw categories that are not worn " +
    "or carried fashion (home, furniture, decor, tableware, beauty, skincare, makeup, fragrance, toys, electronics, " +
    "bicycles, baby-care products like breast pumps) go to a category in the `non-fashion` department. The raw " +
    "value `other` is non-fashion. Leave `also` empty.",
  color:
    "`primary` = the dominant or first-named colour family. `also` = every other colour family named in the value " +
    "(so exclusions stay safe: 'red and white' → primary red, also [white]). Values naming 3+ colours or 'multi' → " +
    "primary multicolor. Map shades to families: mustard→yellow, wine→maroon, rani→pink, khaki→beige, " +
    "charcoal→grey, rust→orange, lavender→purple, cream→off-white. `none` only for non-colours " +
    "('as per image', sizes, fabric names).",
  fabric:
    "`primary` = the main material. A blend with a named partner → primary is the blend family of the main fibre " +
    "and `also` lists the partner fibres ('cotton polyester blend' → cotton-blend, also [polyester]). " +
    "'100% cotton'/'pure cotton' → cotton. Any value mentioning polyester, nylon, viscose, rayon, lycra/spandex " +
    "or elastane must list that fibre in `primary` or `also` (exclusions like 'no polyester' depend on it). " +
    "`none` only for values that are not materials.",
  pattern:
    "`primary` = the dominant pattern or surface technique. `also` = other patterns named ('floral embroidered' → " +
    "primary embroidered or floral, also the other). `none` for values that are not patterns.",
  fit:
    "`primary` = the fit or silhouette. `also` = another fit named in the same value. `none` for values that are " +
    "not a fit (sizes, fabrics, product types).",
  useCase:
    "`primary` = the occasion/use. `also` = other occasions named in the same value ('party & festive'). `none` for " +
    "values that are not an occasion or use (product types, 'home decor', marketing text).",
};

// ---------------------------------------------------------------------------
// LLM steps
// ---------------------------------------------------------------------------

async function proposeCategories(model: string, values: RawValue[], genderMix: Map<string, Map<string, number>>) {
  const schema = z.object({
    categories: z.array(z.object({ id: z.string(), label: z.string(), department: z.enum(DEPARTMENT_IDS) })),
  });
  const lines = values.map((v) => {
    const mix = [...(genderMix.get(v.value) ?? new Map<string, number>()).entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([g, n]) => `${g} ${approx(n)}`)
      .join(", ");
    return `${v.value} (${approx(v.count)}; ${mix})`;
  });
  const res = await llmParse({
    model,
    name: "propose-categories",
    schema,
    system:
      `${CONTEXT}\n\nDesign the canonical product-type categories. A category is what a shopper asks for by name ` +
      "(saree, lehenga, kurta, kurta set, kurti, anarkali, sherwani, nehru jacket, jeans, trousers, shirt, t-shirt, " +
      "polo t-shirt, sneakers, juttis, kolhapuris, jhumkas, potli bag…). Merge raw values that differ only by " +
      "fabric, print, fit, occasion or gender, because those are separate filters ('silk sarees' + 'printed sarees' → " +
      "saree; 'slim fit jeans' + 'skinny jeans' → jeans). Keep distinctions shoppers make when searching " +
      "(kurta vs kurta set vs kurti; t-shirt vs polo; sneakers vs sports shoes; earrings vs jhumkas only if both " +
      "are common). Ids are gender-neutral and singular (`kurta`, not `mens-kurtas`). Aim for 80–160 categories. " +
      "Pick one department per category from the allowed list; `non-fashion` holds everything that is not worn or " +
      "carried fashion (home, decor, beauty, fragrance, toys, electronics, bicycles…). Include a non-fashion " +
      `category for the raw value \`other\`.\n\nDepartments: ${DEPARTMENTS.map((d) => `${d.id} (${d.label})`).join("; ")}.`,
    user: `Raw category values (doc count; gender mix):\n${lines.join("\n")}`,
  });
  return dedupeDefs(
    res.categories.map((c) => ({ id: slug(c.id), label: c.label.trim(), related: [], keywords: [], department: c.department })),
  );
}

/** Parent categories so generic asks cover their variants (dress → maxi-dress, jewellery → earring → jhumka). */
async function assignParents(model: string, cats: (FamilyDef & { department: string })[]): Promise<Map<string, string | null>> {
  const ids = cats.map((c) => c.id) as [string, ...string[]];
  const schema = z.object({
    items: z.array(z.object({ id: z.enum(ids), parent: z.enum([...ids, "none"] as [string, ...string[]]) })),
  });
  const listing = cats.map((c) => `${c.id} — ${c.label} [${c.department}]`).join("\n");
  const out = new Map<string, string | null>();
  const ask = (only: string[] | null) =>
    llmParse({
      model,
      name: "category-parents",
      schema,
      system:
      `${CONTEXT}\n\nFor every category, give its parent: a broader category from this list that a shopper asking ` +
      "for the parent would happily see this item under (maxi-dress → dress, jhumka → earring, kurta-palazzo-set → " +
      "kurta-set, running-shoe → sports-shoe, chelsea-boot → boot, puffer-jacket → jacket). Use `none` when the " +
      "category is itself a top-level type or no broader category exists in the list. The parent must be in the same " +
      "department. Keep genuinely different items apart even if related (polo-t-shirt is not a shirt; kurti is " +
      "not a kurta-set). Return one item per category.",
      user: only ? `${listing}\n\nReturn items only for: ${only.join(", ")}` : listing,
    });
  // The model sometimes returns a short list; ask again for whatever is missing.
  for (let round = 0; round < 3; round++) {
    const missing = ids.filter((id) => !out.has(id));
    if (!missing.length) break;
    const res = await ask(round === 0 ? null : missing);
    for (const it of res.items) if (!out.has(it.id)) out.set(it.id, it.parent === "none" ? null : it.parent);
  }
  for (const id of ids) if (!out.has(id)) out.set(id, null);
  return out;
}

/** Same-department parents only, then human overrides, then cycle breaking. Idempotent. */
function normalizeParents<T extends { id: string; department: string; parent: string | null }>(cats: T[]): T[] {
  const dept = new Map(cats.map((c) => [c.id, c.department]));
  const parent = new Map<string, string | null>(
    cats.map((c) => [c.id, c.parent && c.parent !== c.id && dept.get(c.parent) === c.department ? c.parent : null]),
  );
  for (const [id, p] of Object.entries(PARENT_OVERRIDES)) if (parent.has(id)) parent.set(id, p);
  for (const id of parent.keys()) {
    const seen = new Set([id]);
    let p = parent.get(id);
    while (p) {
      if (seen.has(p)) {
        parent.set(id, null);
        break;
      }
      seen.add(p);
      p = parent.get(p) ?? null;
    }
  }
  return cats.map((c) => ({ ...c, parent: parent.get(c.id) ?? null }));
}

// ---------------------------------------------------------------------------
// Families file (committed, human-editable)
// ---------------------------------------------------------------------------

const FamilyDefSchema = z.object({
  id: z.string(),
  label: z.string(),
  related: z.array(z.string()),
  keywords: z.array(z.string()),
});
const FamiliesFileSchema = z.object({
  categories: z.array(
    z.object({ id: z.string(), label: z.string(), department: z.enum(DEPARTMENT_IDS), parent: z.string().nullable() }),
  ),
  fabric: z.array(FamilyDefSchema),
  pattern: z.array(FamilyDefSchema),
  fit: z.array(FamilyDefSchema),
  useCase: z.array(FamilyDefSchema),
});
type FamiliesFile = z.infer<typeof FamiliesFileSchema>;

async function proposeAll(
  model: string,
  raw: { categories: RawValue[]; fabrics: RawValue[]; patterns: RawValue[]; fits: RawValue[]; useCases: RawValue[] },
): Promise<FamiliesFile> {
  const genderMix = await categoryGenderMix();
  const [catDefs, fabric, pattern, fit, useCase] = await Promise.all([
    proposeCategories(model, raw.categories, genderMix),
    proposeFamilies(model, "fabric", raw.fabrics.slice(0, PROPOSAL_TOP_N)),
    proposeFamilies(model, "pattern", raw.patterns.slice(0, PROPOSAL_TOP_N)),
    proposeFamilies(model, "fit", raw.fits.slice(0, PROPOSAL_TOP_N)),
    proposeFamilies(model, "useCase", raw.useCases.slice(0, PROPOSAL_TOP_N)),
  ]);
  const parents = await assignParents(model, catDefs);
  return {
    categories: catDefs.map((c) => ({ id: c.id, label: c.label, department: c.department, parent: parents.get(c.id) ?? null })),
    fabric,
    pattern,
    fit,
    useCase,
  };
}

/** Normalises a (possibly hand-edited) families file: kebab ids, no duplicates, valid links. */
function normalizeFamilies(f: FamiliesFile): FamiliesFile {
  const cats = dedupeDefs(
    f.categories.map((c) => ({
      id: slug(c.id),
      label: c.label.trim(),
      department: c.department,
      parent: c.parent ? slug(c.parent) : null,
      related: [],
      keywords: [],
    })),
  );
  const fam = (defs: FamilyDef[]) =>
    dedupeDefs(
      defs.map((d) => ({
        id: slug(d.id),
        label: d.label.trim(),
        related: d.related.map(slug),
        keywords: d.keywords.map((k) => k.trim().toLowerCase()).filter(Boolean),
      })),
    );
  return {
    categories: normalizeParents(cats).map(({ id, label, department, parent }) => ({ id, label, department, parent })),
    fabric: fam(f.fabric),
    pattern: fam(f.pattern),
    fit: fam(f.fit),
    useCase: fam(f.useCase),
  };
}

async function proposeFamilies(model: string, field: keyof typeof PROPOSAL_GUIDANCE, values: RawValue[]) {
  const schema = z.object({
    families: z.array(
      z.object({ id: z.string(), label: z.string(), related: z.array(z.string()), keywords: z.array(z.string()) }),
    ),
  });
  const res = await llmParse({
    model,
    name: `propose-${field}`,
    schema,
    system:
      `${CONTEXT}\n\nDesign canonical families for the \`${field}\` facet. ${PROPOSAL_GUIDANCE[field]}\n` +
      "`keywords`: 1–6 short lowercase words/phrases that reliably indicate the family inside a raw value or free " +
      "text (used to classify unseen values; avoid ambiguous substrings).",
    user: `Most frequent raw values (doc count):\n${values.map((v) => `${v.value} (${v.count})`).join("\n")}`,
  });
  return dedupeDefs(
    res.families.map((f) => ({
      id: slug(f.id),
      label: f.label.trim(),
      related: f.related.map(slug),
      keywords: f.keywords.map((k) => k.trim().toLowerCase()).filter(Boolean),
    })),
  );
}

function dedupeDefs<T extends FamilyDef>(defs: T[]): T[] {
  const seen = new Set<string>();
  const out = defs.filter((d) => d.id && !seen.has(d.id) && seen.add(d.id));
  const ids = new Set(out.map((d) => d.id));
  for (const d of out) d.related = [...new Set(d.related)].filter((r) => r !== d.id && ids.has(r));
  return out;
}

async function assignValues(
  model: string,
  field: keyof typeof ASSIGN_GUIDANCE,
  values: RawValue[],
  families: { id: string; label: string }[],
  allowNone: boolean,
): Promise<Map<string, Assignment>> {
  const ids = families.map((f) => f.id) as [string, ...string[]];
  const schema = z.object({
    items: z.array(
      z.object({
        i: z.number().int(),
        primary: z.enum(allowNone ? ([...ids, "none"] as [string, ...string[]]) : ids),
        also: z.array(z.enum(ids)),
        confidence: z.enum(["high", "medium", "low"]),
      }),
    ),
  });
  const system =
    `${CONTEXT}\n\nMap raw \`${field}\` facet values to canonical families. For every input line \`i: value (count)\` ` +
    "return exactly one item with the same `i`. " +
    `${ASSIGN_GUIDANCE[field]}\n` +
    "`confidence`: high = obvious, medium = reasonable guess, low = unclear or ambiguous.\n\n" +
    `Families (id — label):\n${families.map((f) => `${f.id} — ${f.label}`).join("\n")}`;

  const result = new Map<string, Assignment>();
  const run = async (batch: RawValue[], size: number) => {
    const chunks: RawValue[][] = [];
    for (let i = 0; i < batch.length; i += size) chunks.push(batch.slice(i, i + size));
    await mapLimit(chunks, CONCURRENCY, async (chunk) => {
      const res = await llmParse({ model, name: `assign-${field}`, schema, system, user: fmtValues(chunk) });
      for (const it of res.items) {
        const v = chunk[it.i];
        if (!v || result.has(v.value)) continue;
        result.set(v.value, {
          primary: it.primary,
          also: [...new Set(it.also)].filter((a) => a !== it.primary),
          confidence: it.confidence,
        });
      }
    });
  };

  await run(values, BATCH);
  for (let round = 0; round < 2; round++) {
    const missing = values.filter((v) => !result.has(v.value));
    if (!missing.length) break;
    console.log(`    retrying ${missing.length} unassigned ${field} values`);
    await run(missing, RETRY_BATCH);
  }
  const done = values.filter((v) => result.has(v.value)).length;
  console.log(`  ${field.padEnd(8)} ${done}/${values.length} assigned`);
  return result;
}

async function labelBrands(model: string, values: RawValue[]) {
  const schema = z.object({ brands: z.array(z.object({ i: z.number().int(), label: z.string() })) });
  const res = await llmParse({
    model,
    name: "label-brands",
    schema,
    system:
      `${CONTEXT}\n\nClean up brand names for display. For every input line \`i: raw (count)\` return the brand's ` +
      "proper display name as the brand writes it ('Jackjones' → 'Jack & Jones', 'Louisphilippe' → 'Louis " +
      "Philippe', 'Houseofdesigners' → 'House of Designers'). Fix broken character encoding ('KAPRAÃHA' → " +
      "'Kapraaha'). Give two raw values the same label only when they are the same brand. Keep unknown names as " +
      "they are, with sensible capitalisation.",
    user: fmtValues(values),
  });
  return new Map(res.brands.filter((b) => values[b.i]).map((b) => [values[b.i].value, b.label.trim()]));
}

// ---------------------------------------------------------------------------
// Assembly
// ---------------------------------------------------------------------------

function buildFamilies(defs: FamilyDef[], values: RawValue[], assignments: Map<string, Assignment>): Family[] {
  return defs.map((d) => {
    const primary = values.filter((v) => assignments.get(v.value)?.primary === d.id);
    const also = values.filter((v) => assignments.get(v.value)?.also.includes(d.id));
    return {
      id: d.id,
      label: d.label,
      rawValues: primary.map((v) => v.value),
      alsoRawValues: also.map((v) => v.value),
      related: d.related,
      keywords: d.keywords,
      count: primary.reduce((s, v) => s + v.count, 0),
    };
  });
}

async function categoryGenderMix(): Promise<Map<string, Map<string, number>>> {
  const genders = Object.keys(GENDER_MAP);
  const res = await multiSearch(
    genders.map((g) => ({ per_page: 0, filter_by: `gender:=\`${g}\``, facet_by: "category", max_facet_values: 5000 })),
  );
  const mix = new Map<string, Map<string, number>>();
  res.forEach((r, i) => {
    for (const c of r.facet_counts?.[0]?.counts ?? []) {
      if (!mix.has(c.value)) mix.set(c.value, new Map());
      mix.get(c.value)!.set(genders[i], c.count);
    }
  });
  return mix;
}

async function buildPriceStats(tax: Pick<Taxonomy, "categories" | "excludedCategoryValues">) {
  const base = baseFilter({
    excludedGenders: Object.keys(GENDER_MAP).filter((g) => GENDER_MAP[g] === null),
    excludedCategoryValues: tax.excludedCategoryValues,
  });
  const audienceGenders = Object.fromEntries(
    AUDIENCES.map((a) => [a, Object.keys(GENDER_MAP).filter((g) => GENDER_MAP[g] === a)]),
  ) as Record<Audience, string[]>;
  const groups: (PriceGroup & { audience: string; dept: string })[] = [];
  for (const a of AUDIENCES) {
    const g = inFilter("gender", audienceGenders[a]);
    groups.push({ name: `${a}/all`, audience: a, dept: "all", filter: andFilters(base, g) });
    for (const d of DEPARTMENTS) {
      if (d.id === "non-fashion") continue;
      const raws = tax.categories.filter((c) => c.department === d.id).flatMap((c) => c.rawValues);
      if (!raws.length) continue;
      groups.push({ name: `${a}/${d.id}`, audience: a, dept: d.id, filter: andFilters(base, g, inFilter("category", raws)) });
    }
  }
  const stats = await pricePercentiles(groups, [0.25, 0.5, 0.75]);
  const out: Record<string, Record<string, { count: number; p25: number; median: number; p75: number }>> = {};
  stats.forEach((s, i) => {
    // Too few products for a meaningful band; callers fall back to the audience's "all".
    if (s.count < 30 && groups[i].dept !== "all") return;
    if (s.count === 0) return;
    (out[groups[i].audience] ??= {})[groups[i].dept] = {
      count: s.count,
      p25: s.percentiles.get(0.25)!,
      median: s.percentiles.get(0.5)!,
      p75: s.percentiles.get(0.75)!,
    };
  });
  return out;
}

// ---------------------------------------------------------------------------
// Review file
// ---------------------------------------------------------------------------

function reviewMarkdown(
  tax: Taxonomy,
  assigned: Record<string, { values: RawValue[]; assignments: Map<string, Assignment> }>,
  brandLabels: Map<string, string>,
): string {
  const out: string[] = [
    "# Taxonomy review",
    "",
    `Generated ${tax.generatedAt} by \`npm run build:taxonomy\` (${tax.model}). Values with fewer than ${tax.minCount} docs are dropped (except categories, which are all mapped so the non-fashion deny-list is complete).`,
    "",
    "Skim the low-confidence and unmapped lists. To fix a family (id, label, department, parent), edit `data/taxonomy.families.json`. To fix a raw-value mapping, add an entry to `OVERRIDES` / `FABRIC_MERGES` / `PARENT_OVERRIDES` in `scripts/build-taxonomy.ts`. Then re-run; cached LLM calls make re-runs cheap.",
    "",
    "## Categories by department",
    "",
  ];
  for (const d of DEPARTMENTS) {
    const cats = tax.categories.filter((c) => c.department === d.id);
    if (!cats.length) continue;
    out.push(`### ${d.label} (\`${d.id}\`)`, "", "| id | label | parent | docs | audiences | raw values |", "|---|---|---|---:|---|---|");
    for (const c of cats.sort((a, b) => b.count - a.count)) {
      const raws = c.rawValues.slice(0, 8).join(", ") + (c.rawValues.length > 8 ? `, … +${c.rawValues.length - 8}` : "");
      out.push(`| \`${c.id}\` | ${c.label} | ${c.parent ?? ""} | ${c.count.toLocaleString("en-IN")} | ${c.genders.join(", ")} | ${raws} |`);
    }
    out.push("");
  }

  const sections: [string, string, Family[]][] = [
    ["color", "Colour families", tax.colorFamilies],
    ["fabric", "Fabric families", tax.fabricFamilies],
    ["pattern", "Pattern families", tax.patternFamilies],
    ["fit", "Fit families", tax.fitFamilies],
    ["useCase", "Use cases", tax.useCases],
  ];
  for (const [field, title, fams] of sections) {
    const { values, assignments } = assigned[field];
    const none = values.filter((v) => assignments.get(v.value)?.primary === "none");
    const missing = values.filter((v) => !assignments.has(v.value));
    const unsure = values
      .filter((v) => {
        const a = assignments.get(v.value);
        return a && a.primary !== "none" && a.confidence !== "high";
      })
      .sort((a, b) => b.count - a.count);
    out.push(
      `## ${title}`,
      "",
      `${values.length} raw values (≥ ${tax.minCount} docs) → ${fams.length} families. Unmapped (\`none\`): ${none.length}. Not returned by the model: ${missing.length}. Medium/low confidence: ${unsure.length}.`,
      "",
      "| id | label | docs | raw values | also-in | related |",
      "|---|---|---:|---:|---:|---|",
      ...fams
        .slice()
        .sort((a, b) => b.count - a.count)
        .map((f) => `| \`${f.id}\` | ${f.label} | ${f.count.toLocaleString("en-IN")} | ${f.rawValues.length} | ${f.alsoRawValues.length} | ${f.related.join(", ")} |`),
      "",
    );
    if (unsure.length) {
      out.push(`### Medium/low confidence (top ${Math.min(60, unsure.length)} by docs)`, "", "| raw value | docs | → primary | also | confidence |", "|---|---:|---|---|---|");
      for (const v of unsure.slice(0, 60)) {
        const a = assignments.get(v.value)!;
        out.push(`| ${v.value.replace(/\|/g, "/")} | ${v.count} | \`${a.primary}\` | ${a.also.join(", ")} | ${a.confidence} |`);
      }
      out.push("");
    }
    const bigNone = none.filter((v) => v.count >= 20).sort((a, b) => b.count - a.count);
    if (bigNone.length || missing.length) {
      out.push("### Unmapped values with ≥ 20 docs", "", ...[...bigNone, ...missing].slice(0, 40).map((v) => `- ${v.value} (${v.count})${assignments.has(v.value) ? "" : " — not returned"}`), "");
    }
  }

  const renamed = [...brandLabels.entries()].filter(([raw, label]) => raw !== label);
  const merged = tax.brands.filter((b) => b.rawValues.length > 1);
  out.push(
    "## Brands",
    "",
    `${tax.brands.length} brands. Renamed for display: ${renamed.length}. Merged: ${merged.length}.`,
    "",
    ...renamed.map(([raw, label]) => `- ${raw} → **${label}**`),
    ...merged.map((b) => `- merged into **${b.label}**: ${b.rawValues.join(", ")}`),
    "",
    "## Excluded category values (non-fashion deny-list)",
    "",
    tax.excludedCategoryValues.join(", "),
    "",
  );
  return out.join("\n");
}

// ---------------------------------------------------------------------------

async function main() {
  const env = getEnv();
  const model = env.OPENAI_MODEL_OFFLINE;
  const started = Date.now();
  console.log(`Building taxonomy with ${model}…`);

  const [catRaw, colorRaw, fabricRaw, patternRaw, fitRaw, useCaseRaw, brandRaw, genderRaw] = await Promise.all(
    ["category", "color", "fabric", "pattern", "fit", "use_case", "brand", "gender"].map(loadFacet),
  );
  for (const g of genderRaw) {
    if (!(g.value in GENDER_MAP)) throw new Error(`Unknown gender value "${g.value}": add it to GENDER_MAP`);
  }
  const keep = (vals: RawValue[]) => vals.filter((v) => v.count >= MIN_COUNT);
  // All category values are mapped (not just ≥ MIN_COUNT) so the non-fashion deny-list has no gaps.
  const categories = catRaw;
  const colors = keep(colorRaw);
  const fabrics = keep(fabricRaw);
  const patterns = keep(patternRaw);
  const fits = keep(fitRaw);
  const useCases = keep(useCaseRaw);
  const brands = keep(brandRaw);

  const repropose = process.argv.includes("--repropose");
  let familiesFile: FamiliesFile;
  if (existsSync(FAMILIES_FILE) && !repropose) {
    console.log("1/5 families from data/taxonomy.families.json");
    familiesFile = FamiliesFileSchema.parse(await readJson(FAMILIES_FILE));
  } else {
    console.log("1/5 proposing families");
    familiesFile = await proposeAll(model, { categories, fabrics, patterns, fits, useCases });
  }
  familiesFile = normalizeFamilies(familiesFile);
  await writeJson(FAMILIES_FILE, familiesFile);
  const catDefs = familiesFile.categories.map((c) => ({ ...c, related: [], keywords: [] }));
  const { fabric: fabricDefs, pattern: patternDefs, fit: fitDefs, useCase: useCaseDefs } = familiesFile;
  const genderMix = await categoryGenderMix();
  console.log(
    `  categories ${catDefs.length} · fabric ${fabricDefs.length} · pattern ${patternDefs.length} · fit ${fitDefs.length} · useCase ${useCaseDefs.length}`,
  );

  console.log("2/5 assigning raw values");
  const catAssign = await assignValues(model, "category", categories, catDefs, false);
  const colorAssign = await assignValues(model, "color", colors, COLOR_FAMILIES, true);
  const fabricAssign = await assignValues(model, "fabric", fabrics, fabricDefs, true);
  const patternAssign = await assignValues(model, "pattern", patterns, patternDefs, true);
  const fitAssign = await assignValues(model, "fit", fits, fitDefs, true);
  const useCaseAssign = await assignValues(model, "useCase", useCases, useCaseDefs, true);

  const fabricFinalDefs = applyMerges(fabricDefs, fabricAssign, FABRIC_MERGES);
  applyOverrides("fabric", fabricAssign, new Set(fabricFinalDefs.map((d) => d.id)));
  applyOverrides("color", colorAssign, new Set(COLOR_FAMILIES.map((d) => d.id)));
  applyOverrides("pattern", patternAssign, new Set(patternDefs.map((d) => d.id)));
  applyOverrides("fit", fitAssign, new Set(fitDefs.map((d) => d.id)));
  applyOverrides("useCase", useCaseAssign, new Set(useCaseDefs.map((d) => d.id)));

  console.log("3/5 brands");
  const brandLabels = await labelBrands(model, brands);
  const brandGroups = new Map<string, { label: string; raws: RawValue[] }>();
  for (const b of brands) {
    const label = brandLabels.get(b.value) ?? b.value;
    const id = slug(label) || slug(b.value);
    const g = brandGroups.get(id) ?? { label, raws: [] };
    g.raws.push(b);
    brandGroups.set(id, g);
  }
  const brandFamilies: Family[] = [...brandGroups.entries()]
    .map(([id, g]) => ({
      id,
      label: g.label,
      rawValues: g.raws.map((r) => r.value),
      alsoRawValues: [],
      related: [],
      keywords: [...new Set([g.label.toLowerCase(), ...g.raws.map((r) => r.value.toLowerCase())])],
      count: g.raws.reduce((s, r) => s + r.count, 0),
    }))
    .sort((a, b) => b.count - a.count);

  // Categories: non-fashion raw values become the deny-list; the raw value "other" is always excluded.
  const catById = new Map(catDefs.map((c) => [c.id, c]));
  const categoryList: Category[] = catDefs.map((d) => {
    const raws = categories.filter((v) => catAssign.get(v.value)?.primary === d.id);
    const audienceCounts = new Map<Audience, number>();
    for (const r of raws) {
      for (const [g, n] of genderMix.get(r.value) ?? []) {
        const a = GENDER_MAP[g];
        if (a) audienceCounts.set(a, (audienceCounts.get(a) ?? 0) + n);
      }
    }
    return {
      id: d.id,
      label: d.label,
      department: d.department as DepartmentId,
      parent: d.parent,
      rawValues: raws.map((r) => r.value),
      genders: AUDIENCES.filter((a) => (audienceCounts.get(a) ?? 0) >= MIN_COUNT),
      count: raws.reduce((s, r) => s + r.count, 0),
    };
  });
  const excludedCategoryValues = categories
    .filter((v) => v.value === "other" || catById.get(catAssign.get(v.value)?.primary ?? "")?.department === "non-fashion")
    .map((v) => v.value);
  const fashionCategories = categoryList.filter((c) => c.department !== "non-fashion" && c.rawValues.length > 0);
  // "other" must never be searchable, even if the model filed it under a fashion category.
  for (const c of fashionCategories) c.rawValues = c.rawValues.filter((v) => v !== "other");
  // A parent that was dropped (empty or non-fashion) can't group anything.
  const fashionIds = new Set(fashionCategories.map((c) => c.id));
  for (const c of fashionCategories) if (c.parent && !fashionIds.has(c.parent)) c.parent = null;

  console.log("4/5 price stats per audience × department");
  const priceStats = await buildPriceStats({ categories: fashionCategories, excludedCategoryValues });

  const taxonomy: Taxonomy = TaxonomySchema.parse({
    version: 1,
    generatedAt: new Date().toISOString(),
    model,
    minCount: MIN_COUNT,
    genderMap: GENDER_MAP,
    categories: fashionCategories,
    excludedCategoryValues,
    colorFamilies: buildFamilies(COLOR_FAMILIES, colors, colorAssign),
    fabricFamilies: buildFamilies(fabricFinalDefs, fabrics, fabricAssign),
    patternFamilies: buildFamilies(patternDefs, patterns, patternAssign),
    fitFamilies: buildFamilies(fitDefs, fits, fitAssign),
    useCases: buildFamilies(useCaseDefs, useCases, useCaseAssign),
    brands: brandFamilies,
    priceStats,
  });

  console.log("5/5 writing");
  await writeJson(path.join(ROOT, "data", "taxonomy.json"), taxonomy);
  await writeFile(
    path.join(ROOT, "data", "taxonomy.review.md"),
    reviewMarkdown(
      taxonomy,
      {
        color: { values: colors, assignments: colorAssign },
        fabric: { values: fabrics, assignments: fabricAssign },
        pattern: { values: patterns, assignments: patternAssign },
        fit: { values: fits, assignments: fitAssign },
        useCase: { values: useCases, assignments: useCaseAssign },
      },
      brandLabels,
    ),
    "utf8",
  );
  console.log(
    `Done in ${((Date.now() - started) / 1000).toFixed(0)}s · LLM calls ${usage.calls} (+${usage.cached} cached) · ` +
      `${usage.inTokens.toLocaleString()} in / ${usage.outTokens.toLocaleString()} out · ~$${usage.costUsd.toFixed(2)}`,
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? (err.stack ?? err.message) : err);
  process.exitCode = 1;
});
