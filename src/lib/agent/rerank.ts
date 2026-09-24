/**
 * LLM rerank + reasons (brief §6.6). Candidates are split into small chunks scored in parallel:
 * output tokens dominate latency, so 5 × 12 beats 1 × 60.
 */
import { z } from "zod";
import { getEnv } from "../env";
import { llmStructured, type Usage } from "../llm";
import { cleanText } from "./cleanText";
import type { TaxonomyApi } from "./taxonomy";
import { CONSTRAINT_FIELDS, TAXONOMY_FIELD, type Intent, type ProductCard } from "./types";

export const RERANK_CHUNK = 4;
export const MIN_SCORE = 0.35;

const RerankSchema = z.object({
  items: z.array(
    z.object({
      i: z.number().int(),
      score: z.number(),
      reason: z.string(),
      matched: z.array(z.string()),
      violates: z.array(z.string()),
    }),
  ),
});

const SYSTEM = `You rank fashion products for an Indian shopping assistant and write one-line reasons.
For EVERY candidate line return {i, score, reason, matched, violates}.
- score 0..1: how well it fits what the user asked for (product type, audience, colours, fabric, occasion, budget, softPreferences, body type). 0.8+ = clearly what they asked for; 0.5 = plausible; <0.35 = wrong item.
- Use the session taste only to break ties between otherwise equal items.
- violates: ONLY an explicit exclusion (EXCLUDE lines) or a "must" requirement the product clearly breaks, judged from its title/data (e.g. "has cutouts", "polyester", "red", "men's item for a women's request", "over the must budget"). Anything marked "prefer" is never a violation: just lower the score. Empty if none.
- reason: ≤ 16 words, specific and factual, using ONLY the product data and the user's own words. Mention the concrete attributes that match (fabric, colour, fit, occasion). Mention a budget ONLY if the user stated one (see "Budget"); never invent one. Write prices as ₹1,799. No hype, no "perfect", "stunning", "you'll love". Never invent attributes the data doesn't show.
  Good: "Pure cotton, straight fit, black — office-ready at ₹1,799, under your ₹2k."
  Bad: "Perfect stylish choice you'll love!"
- matched: 1–3 short tags for what matches (e.g. "cotton", "under ₹2k", "no slit").
Data fields: i | title | brand | category | colour | fabric | fit | pattern | occasions | price | description.`;

export function intentSummary(intent: Intent, tax: TaxonomyApi): string {
  const parts: string[] = [];
  const a = intent.audience;
  if (a.segment !== "unknown") parts.push(`audience: ${a.segment}${a.kidGender ? ` ${a.kidGender}` : ""}${a.ageYears != null ? ` ${a.ageYears}y` : ""}`);
  for (const f of CONSTRAINT_FIELDS) {
    const c = intent[f];
    const tf = TAXONOMY_FIELD[f];
    if (c.include.length) parts.push(`${f} ${c.strength}: ${c.include.map((id) => tax.label(tf, id)).join(", ")}`);
    if (c.exclude.length) parts.push(`${f} EXCLUDE: ${c.exclude.map((id) => tax.label(tf, id)).join(", ")}`);
  }
  parts.push(
    intent.price
      ? `Budget (${intent.price.strength}): ${intent.price.min ? `₹${intent.price.min}` : "₹0"}–${intent.price.max ? `₹${intent.price.max}` : "any"}`
      : "Budget: none stated",
  );
  if (intent.textExclusions.length) parts.push(`EXCLUDE (text): ${intent.textExclusions.join(", ")}`);
  if (intent.softPreferences.length) parts.push(`prefers: ${intent.softPreferences.join(", ")}`);
  if (intent.occasion) parts.push(`occasion: ${[intent.occasion.name, intent.occasion.location, intent.occasion.timeOfYear, intent.occasion.role].filter(Boolean).join(", ")}`);
  if (intent.bodyType) parts.push(`body type: ${intent.bodyType}`);
  return parts.join("; ");
}

const candidateLine = (p: ProductCard, i: number, desc?: string) =>
  [i, p.title, p.brand, p.category, p.color, p.fabric ?? "", p.fit ?? "", p.pattern ?? "", p.useCase.slice(0, 3).join("/"), `₹${Math.round(p.price)}`, (desc ?? "").slice(0, 120)]
    .join(" | ");

export type RerankItem = { id: string; score: number; reason: string; matched: string[]; violates: string[] };

export async function rerank(opts: {
  query: string;
  intent: Intent;
  tax: TaxonomyApi;
  products: ProductCard[];
  descriptions?: Map<string, string>;
  taste?: string;
  usage?: Usage;
  signal?: AbortSignal;
  /** Collects per-chunk failures for the debug panel. */
  errors?: string[];
}): Promise<RerankItem[]> {
  const header = [
    `User's words: ${opts.query}`,
    `Understood: ${intentSummary(opts.intent, opts.tax)}`,
    opts.taste ? `Session taste (tie-break only): ${opts.taste}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  const chunks: ProductCard[][] = [];
  for (let i = 0; i < opts.products.length; i += RERANK_CHUNK) chunks.push(opts.products.slice(i, i + RERANK_CHUNK));
  const model = getEnv().OPENAI_MODEL_FAST;
  const results = await Promise.all(
    chunks.map(async (chunk) => {
      const lines = chunk.map((p, i) => candidateLine(p, i, cleanText(opts.descriptions?.get(p.id))));
      try {
        const res = await llmStructured({
          name: "rerank",
          model,
          schema: RerankSchema,
          system: SYSTEM,
          user: `${header}\n\nCandidates:\n${lines.join("\n")}`,
          usage: opts.usage,
          signal: opts.signal,
          timeoutMs: 15_000,
          maxTokens: 700,
        });
        return res.items
          .filter((it) => chunk[it.i])
          .map((it) => ({
            id: chunk[it.i].id,
            score: Math.max(0, Math.min(1, it.score)),
            reason: it.reason.trim(),
            matched: it.matched.slice(0, 3),
            violates: it.violates,
          }));
      } catch (err) {
        opts.errors?.push(err instanceof Error ? err.message : String(err));
        return [];
      }
    }),
  );
  return results.flat();
}

/**
 * Applies rerank output: orders by score (stable by fused order on ties) and drops low scores.
 * Exclusions and must-requirements are already enforced in code (filters + post-filter), so an LLM
 * "violates" only drops an item when it names one of the user's text exclusions; any other claimed
 * violation (the model tends to flag missed *preferences*) halves the score instead.
 */
export function applyRerank(products: ProductCard[], items: RerankItem[], textExclusions: string[] = []) {
  const byId = new Map(items.map((it) => [it.id, it]));
  const excl = textExclusions.map((t) => t.toLowerCase().split(/\s+/).find((w) => w.length > 3) ?? t.toLowerCase());
  const hard = (v: string) => excl.some((w) => v.toLowerCase().includes(w));
  const kept: ProductCard[] = [];
  const dropped: { id: string; title: string; why: string }[] = [];
  products.forEach((p, idx) => {
    const it = byId.get(p.id);
    if (!it) {
      // Not scored (chunk failed): keep at its hybrid position with a neutral score.
      kept.push({ ...p, score: 0.5 - idx / 10_000 });
      return;
    }
    if (it.violates.some(hard)) return void dropped.push({ id: p.id, title: p.title, why: it.violates.join("; ") });
    const score = it.violates.length ? it.score / 2 : it.score;
    if (score < MIN_SCORE) return void dropped.push({ id: p.id, title: p.title, why: `score ${score.toFixed(2)}${it.violates.length ? ` (${it.violates.join("; ")})` : ""}` });
    kept.push({ ...p, score, reason: it.reason || p.reason, matched: it.matched.length ? it.matched : p.matched });
  });
  kept.sort((a, b) => b.score - a.score);
  return { kept, dropped };
}
