/** Occasion / vibe / gift / browse → stylist note + 3–5 category rails (brief §6.7). */
import { z } from "zod";
import { getEnv } from "../env";
import { llmStructured, type Usage } from "../llm";
import { mergeIntent, sanitizeIntent } from "./intent";
import { intentSummary } from "./rerank";
import type { TaxonomyApi } from "./taxonomy";
import type { Intent } from "./types";

const PlanSchema = z.object({
  stylistNote: z.string(),
  rails: z.array(
    z.object({
      title: z.string(),
      why: z.string(),
      categories: z.array(z.string()),
      colors: z.array(z.string()),
      fabrics: z.array(z.string()),
      patterns: z.array(z.string()),
      useCases: z.array(z.string()),
      softPreferences: z.array(z.string()),
      semanticQuery: z.string(),
      budgetMax: z.number().nullable(),
    }),
  ),
});

export type PlannedRail = { id: string; title: string; why: string; intent: Intent };
export type Plan = { stylistNote: string; rails: PlannedRail[] };

const system = (tax: TaxonomyApi) => `You are a stylist for Indian shoppers. Given an occasion, vibe, gift or vague browse request, write:
- stylistNote: 2–3 sentences with real Indian context (typical colour palettes for the event, weather for the place and month, dress codes). Practical, warm, no hype. If a total budget is given, say how you split it.
- rails: 3–5 category suggestions the shopper needs to complete the look (e.g. sangeet in Udaipur in December for women: lehenga/anarkali; shawl or stole because evenings drop to ~10°C; juttis or block heels; potli bag; jhumkas). Gifts: price-appropriate categories for the recipient. Vibes: the core pieces (old money men: polos, chinos, loafers, knitwear).
  Each rail: title (2–4 words), why (≤ 12 words, specific), categories (canonical ids, 1–3), optional colors/fabrics/patterns/useCases ids that suit the occasion, softPreferences, semanticQuery (clean English, 6–12 words, for embedding search), budgetMax (per-rail ₹ cap when the user gave a total budget; split by typical category share; else null).
- Respect the audience: only categories worn by that audience. Never include categories the user excluded.
Use ONLY these ids:
${tax.promptVocabulary({ brands: false })}`;

export async function planRails(opts: {
  query: string;
  intent: Intent;
  tax: TaxonomyApi;
  today?: Date;
  usage?: Usage;
  signal?: AbortSignal;
}): Promise<Plan> {
  const { intent, tax } = opts;
  const res = await llmStructured({
    name: "plan",
    model: getEnv().OPENAI_MODEL_FAST,
    schema: PlanSchema,
    system: system(tax),
    user: `Today: ${(opts.today ?? new Date()).toISOString().slice(0, 10)}\nRequest: ${opts.query}\nUnderstood: ${intentSummary(intent, tax)}`,
    usage: opts.usage,
    signal: opts.signal,
    timeoutMs: 12_000,
  });
  const rails = res.rails.slice(0, 5).map((r, idx) => {
    const totalMax = intent.price?.max ?? null;
    const railMax = r.budgetMax && totalMax ? Math.min(r.budgetMax, totalMax) : (r.budgetMax ?? null);
    const patched = mergeIntent(intent, {
      kind: "product",
      semanticQuery: r.semanticQuery || r.title,
      categories: { include: r.categories, exclude: intent.categories.exclude, strength: "must" },
      colors: { ...intent.colors, include: intent.colors.strength === "must" ? intent.colors.include : r.colors, strength: intent.colors.strength },
      fabrics: { ...intent.fabrics, include: intent.fabrics.strength === "must" ? intent.fabrics.include : r.fabrics, strength: intent.fabrics.strength },
      patterns: { ...intent.patterns, include: r.patterns.length ? r.patterns : intent.patterns.include, strength: "prefer" },
      useCases: { ...intent.useCases, include: [...new Set([...intent.useCases.include, ...r.useCases])], strength: "prefer" },
      softPreferences: [...new Set([...intent.softPreferences, ...r.softPreferences])],
      price: railMax ? { min: null, max: railMax, strength: "must" } : intent.price,
      needsClarification: null,
    });
    return {
      id: `rail-${idx + 1}`,
      title: r.title,
      why: r.why,
      intent: sanitizeIntent(patched, tax),
    };
  });
  return { stylistNote: res.stylistNote, rails: rails.filter((r) => r.intent.categories.include.length) };
}

const RewriteSchema = z.object({ semanticQuery: z.string() });

/** Adapt step (brief §6 step 7): one rewrite of the semantic query when too few good matches survive. */
export async function rewriteQuery(opts: { query: string; intent: Intent; tax: TaxonomyApi; usage?: Usage; signal?: AbortSignal }): Promise<string> {
  const res = await llmStructured({
    name: "rewrite",
    model: getEnv().OPENAI_MODEL_FAST,
    schema: RewriteSchema,
    system:
      "Rewrite a fashion search query for an English embedding model over product titles. Use the words catalogs use in titles (garment type, colour, fabric, pattern, occasion). 5–12 words. No brand names unless required.",
    user: `User said: ${opts.query}\nCurrent semantic query: ${opts.intent.semanticQuery}\nUnderstood: ${intentSummary(opts.intent, opts.tax)}`,
    usage: opts.usage,
    signal: opts.signal,
    timeoutMs: 8_000,
  });
  return res.semanticQuery.trim() || opts.intent.semanticQuery;
}
