/** Query → Intent with a structured-output LLM call (brief §6.1). */
import { getEnv } from "../env";
import { llmStructured, type Usage } from "../llm";
import type { TaxonomyApi } from "./taxonomy";
import { DEPARTMENTS, type FacetField } from "./taxonomy.schema";
import { CONSTRAINT_FIELDS, IntentSchema, TAXONOMY_FIELD, emptyIntent, type Intent } from "./types";

const EXAMPLES = `Examples (only the notable fields; everything else empty/null):
1. "black cotton kurta set for office under 2000" → kind product; audience women (implied, "kurta set" + office is mostly women's unless stated); categories must [kurta-set]; colors must [black]; fabrics must [cotton]; useCases prefer [office]; price max 2000 must; semanticQuery "black cotton kurta set for office wear".
2. "shaadi mein pehenne ke liye sherwani, ivory ya beige" → language hinglish; audience men implied; categories must [sherwani]; colors must [off-white, beige]; useCases prefer [wedding]; semanticQuery "ivory or beige sherwani for a wedding".
3. "what should I wear to a mehendi in Jaipur in November" → kind occasion; audience unknown → needsClarification {question "Who are you shopping for?", options ["Women","Men","Kids"]} and best-guess segment women source implied; occasion {name "mehendi", location "Jaipur", timeOfYear "November"}; useCases prefer [festive, wedding]; colors prefer [yellow, green]; semanticQuery "festive mehendi outfit in bright yellow or green".
4. "floral maxi dress, no polyester" → audience women implied; categories must [maxi-dress]; patterns must [floral]; fabrics exclude [polyester]; semanticQuery "floral print maxi dress".
5. "birthday party dress for my 6 year old daughter" → audience kids, kidGender girl, ageYears 6, explicit; categories must [dress]; useCases prefer [party]; semanticQuery "girls birthday party dress".
6. "old money look for men" → kind vibe; audience men explicit; softPreferences ["quiet luxury","classic","muted neutrals"]; colors prefer [beige, navy, off-white]; semanticQuery "classic understated menswear in muted neutral tones".
7. "saree for farewell — elegant, not too heavy" → audience women implied; categories must [saree]; occasion {name "college farewell"}; textExclusions ["heavy embroidery"]; softPreferences ["elegant","lightweight"]; semanticQuery "elegant lightweight saree for a college farewell".
8. "bodycon dress, no cutouts, not red" → categories must [bodycon-dress]; colors exclude [red]; textExclusions ["cutouts"]; audience women implied.
9. "gift for my dad's 60th birthday under 3000" → kind gift; audience men explicit; occasion {name "60th birthday", role "father"}; price max 3000 must; semanticQuery "classic gift for an older man".
10. "kuch accha sa dikhao party ke liye" → kind browse; language hinglish; audience unknown → needsClarification {"Who is it for?", ["Women","Men","Kids"]}, best guess women implied; useCases prefer [party]; semanticQuery "stylish party wear".
11. "denim jacket like levis but cheaper" → categories must [denim-jacket]; brands prefer [] (don't include levis — they want alternatives); softPreferences ["levi's-style classic denim"]; price max ≈ the category's p25–median, prefer; semanticQuery "classic blue denim jacket".
12. "diwali ethnic wear for a 2 year old boy" → kind occasion; audience kids, boy, ageYears 2; useCases prefer [festive]; occasion {name "Diwali"}; semanticQuery "boys festive ethnic kurta set for toddlers".`;

export function priceBandsText(tax: TaxonomyApi): string {
  const lines: string[] = [];
  for (const [aud, byDept] of Object.entries(tax.data.priceStats)) {
    const parts = Object.entries(byDept)
      .filter(([, b]) => b.count >= 100)
      .map(([d, b]) => `${d} ${b.p25}/${b.median}/${b.p75}`);
    lines.push(`${aud}: ${parts.join("; ")}`);
  }
  return lines.join("\n");
}

let cachedSystem: string | null = null;

/** Static system prompt: identical across requests so OpenAI prompt caching applies. */
export function intentSystemPrompt(tax: TaxonomyApi): string {
  if (cachedSystem) return cachedSystem;
  cachedSystem = `You are the query understanding step of an Indian fashion shopping assistant (women, men, kids; apparel, footwear, bags, accessories, jewellery). Users write English, Hinglish or Hindi in Latin script. Convert the request into the Intent JSON.

Rules
- Use ONLY canonical ids from the vocabulary below for categories/colors/fabrics/patterns/fits/useCases/brands. If nothing fits, leave the field empty and put the concept in softPreferences (positive) or textExclusions (negative) or semanticQuery.
- Categories: pick the most specific id the user named; a generic word ("dress", "kurta set", "earrings", "bag", "jewellery") maps to the parent id (children are included automatically). Categories in brackets are children of the id before the bracket.
- strength "must": explicit product type, explicit audience, budget ("under 2k", "₹1500 ke andar", "2-3 hazaar" = 2000–3000), explicit exclusions, explicit material ("100% cotton", "only linen").
- strength "prefer": style words (elegant, breezy), inferred occasion categories/colours/use cases, profile defaults.
- Every negative the user states goes into a Constraint.exclude (if it maps to an id) or textExclusions (cutouts, slit, sleeveless, sheer, heavy embroidery, deep neck, backless…). Excludes always apply regardless of strength.
- Price: "k" = ×1000. "around 2000" → 1600–2400 prefer. "cheap"/"budget" → max ≈ that audience+department's p25, prefer. "premium"/"luxury" → min ≈ p75, prefer. Never invent a budget. Only strength must when the user states a limit.
- semanticQuery: a clean, descriptive ENGLISH phrase (6–14 words) for embedding search: garment type, colours, fabric, pattern, occasion, style. Never raw Hinglish. No brand names unless the user wants that brand.
- mustKeywords: rarely; only literal craft/product words that must appear in the title (chikankari, kolhapuri, bandhani, ikat, banarasi, kalamkari) when no id covers them.
- Indian context: decode festivals and events (sangeet, mehendi → yellow/green, haldi → yellow, Navratri/garba → chaniya choli/lehenga, bright mirror work; Diwali; Eid; Karva Chauth → red; Pongal/Onam → cream-and-gold saree/mundu; farewell; college fest), places and seasons (Manali/Shimla in winter = cold, Goa = beach/humid, monsoon June–Sept = quick-dry, no suede). Use today's date for "this weekend", "next month", season.
- Audience: explicit words win (for men, my wife, daughter, 6 year old). Gender-implicit items imply it (kurti/saree/lehenga → women; sherwani → men). If still unknown and the profile has exactly one audience, use it with source "profile". Otherwise set needsClarification {question, options like ["Women","Men","Kids"]} AND still pick a best-guess segment. Kids: set kidGender and ageYears when stated.
- Clarify at most once and only when a wrong guess would make most results useless. Never ask about budget, colour or size.
- kind: product (a specific item), occasion (an event to dress for), vibe (an aesthetic), gift, similar (like an image/product), browse (vague).
- sort: price_asc only for "cheapest/lowest price", price_desc for "most expensive"; otherwise relevance.
- sizes: only when the user states a size.

Vocabulary (ids)
${tax.promptVocabulary()}

Departments: ${DEPARTMENTS.filter((d) => d.id !== "non-fashion").map((d) => d.id).join(", ")}.

Typical in-stock prices, ₹ p25/median/p75 by audience and department:
${priceBandsText(tax)}

${EXAMPLES}`;
  return cachedSystem;
}

export type IntentContext = {
  today?: Date;
  tasteSummary?: string;
  profileAudiences?: string[];
  usage?: Usage;
  signal?: AbortSignal;
};

export async function extractIntent(query: string, tax: TaxonomyApi, ctx: IntentContext = {}): Promise<Intent> {
  const today = (ctx.today ?? new Date()).toISOString().slice(0, 10);
  const user = [
    `Today: ${today}.`,
    ctx.profileAudiences?.length ? `Profile audiences: ${ctx.profileAudiences.join(", ")}.` : "Profile audiences: none.",
    ctx.tasteSummary ? `Session taste (for tie-breaks only, never override the request): ${ctx.tasteSummary}` : "",
    `Request: ${query}`,
  ]
    .filter(Boolean)
    .join("\n");
  const raw = await llmStructured({
    name: "intent",
    model: getEnv().OPENAI_MODEL_FAST,
    schema: IntentSchema,
    system: intentSystemPrompt(tax),
    user,
    usage: ctx.usage,
    signal: ctx.signal,
    timeoutMs: 12_000,
  });
  return sanitizeIntent(raw, tax, query);
}

const singular = (id: string) => [id, id.replace(/ies$/, "y"), id.replace(/es$/, ""), id.replace(/s$/, "")];
const slugify = (s: string) => s.toLowerCase().trim().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

/** Maps a model-produced id onto the taxonomy, or null. */
export function resolveId(tax: TaxonomyApi, field: FacetField, id: string): string | null {
  for (const cand of singular(slugify(id))) if (cand && tax.has(field, cand)) return cand;
  if (field === "brand") {
    const s = slugify(id).replace(/-/g, "");
    const hit = tax.families("brand").find((b) => b.id.replace(/-/g, "") === s || b.rawValues.some((r) => slugify(r).replace(/-/g, "") === s));
    return hit?.id ?? null;
  }
  if (field !== "category") return tax.classify(field, id.replace(/-/g, " "))[0] ?? null;
  return null;
}

/** Drops/repairs unknown ids and normalises edge cases, so downstream code can trust the Intent. */
export function sanitizeIntent(intent: Intent, tax: TaxonomyApi, query = ""): Intent {
  const out = structuredClone(intent);
  for (const f of CONSTRAINT_FIELDS) {
    const tf = TAXONOMY_FIELD[f];
    const fix = (ids: string[], onMiss: (id: string) => void) => {
      const kept: string[] = [];
      for (const id of ids) {
        const r = resolveId(tax, tf, id);
        if (r) kept.push(r);
        else onMiss(id.replace(/-/g, " "));
      }
      return [...new Set(kept)];
    };
    out[f].include = fix(out[f].include, (w) => out.softPreferences.push(w));
    out[f].exclude = fix(out[f].exclude, (w) => out.textExclusions.push(w));
    // An id can't be both wanted and excluded; the exclusion wins.
    out[f].include = out[f].include.filter((id) => !out[f].exclude.includes(id));
  }
  out.softPreferences = [...new Set(out.softPreferences.map((s) => s.trim()).filter(Boolean))].slice(0, 8);
  out.textExclusions = [...new Set(out.textExclusions.map((s) => s.trim().toLowerCase()).filter(Boolean))];
  out.mustKeywords = [...new Set(out.mustKeywords.map((s) => s.trim().toLowerCase()).filter(Boolean))].slice(0, 3);
  if (out.audience.segment === "kids" && !out.audience.kidGender) out.audience.kidGender = "any";
  if (out.audience.segment !== "kids") {
    out.audience.kidGender = null;
    out.audience.ageYears = null;
  }
  if (out.price) {
    let { min, max } = out.price;
    if (min != null && min <= 0) min = null;
    if (max != null && max <= 0) max = null;
    if (min != null && max != null && min > max) [min, max] = [max, min];
    out.price = min == null && max == null ? null : { ...out.price, min, max };
  }
  if (out.sizes && !out.sizes.values.length) out.sizes = null;
  if (!out.semanticQuery.trim()) out.semanticQuery = query;
  if (out.needsClarification && !out.needsClarification.options.length) out.needsClarification = null;
  return out;
}

/** Deep-merges a patch (overrides, planner rail, refine agent) into an intent. */
export function mergeIntent(base: Intent, patch: Partial<Intent> | null | undefined): Intent {
  if (!patch) return base;
  const out = structuredClone(base);
  for (const [k, v] of Object.entries(patch) as [keyof Intent, unknown][]) {
    if (v === undefined) continue;
    if ((CONSTRAINT_FIELDS as readonly string[]).includes(k) && v && typeof v === "object") {
      (out as Record<string, unknown>)[k] = { ...(out[k] as object), ...(v as object) };
    } else if (k === "audience" && v && typeof v === "object") {
      out.audience = { ...out.audience, ...(v as object) };
    } else {
      (out as Record<string, unknown>)[k] = v;
    }
  }
  return out;
}

export { emptyIntent };
