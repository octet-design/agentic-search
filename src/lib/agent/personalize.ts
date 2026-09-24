/**
 * The only ways session taste touches the Intent (brief §8.3.1). Explicit words always win;
 * taste never adds hard filters except sizes when the user turned on "only my size".
 */
import { z } from "zod";
import type { TaxonomyApi } from "./taxonomy";
import type { Intent } from "./types";

export const TastePayloadSchema = z.object({
  summary: z.string().max(2000).default(""),
  audiences: z.array(z.enum(["women", "men", "girls", "boys"])).default([]),
  budget: z.object({ min: z.number().nullable().optional(), max: z.number().nullable().optional() }).nullable().default(null),
  sizes: z.object({ top: z.string().optional(), bottom: z.string().optional(), footwear: z.string().optional() }).default({}),
  onlyMySize: z.boolean().default(false),
  avoidColors: z.array(z.string()).default([]),
  avoidFabrics: z.array(z.string()).default([]),
  /** Coarse hash of the taste for cache keys. */
  bucket: z.string().default(""),
});
export type TastePayload = z.infer<typeof TastePayloadSchema>;

const SIZE_SLOT: Record<string, "top" | "bottom" | "footwear"> = {
  "ethnic-wear": "top",
  "western-tops": "top",
  "dresses-jumpsuits": "top",
  "co-ord-sets": "top",
  outerwear: "top",
  activewear: "top",
  "western-bottoms": "bottom",
  footwear: "footwear",
};

const inr = (n: number) => `₹${n >= 1000 ? `${+(n / 1000).toFixed(1)}k` : n}`;

export function applyTaste(intent: Intent, taste: TastePayload | undefined, tax: TaxonomyApi): { intent: Intent; notes: string[] } {
  if (!taste) return { intent, notes: [] };
  const out = structuredClone(intent);
  const notes: string[] = [];

  if (out.audience.segment === "unknown" && taste.audiences.length === 1) {
    const a = taste.audiences[0];
    out.audience =
      a === "girls" || a === "boys"
        ? { segment: "kids", kidGender: a === "girls" ? "girl" : "boy", ageYears: null, source: "profile" }
        : { segment: a, kidGender: null, ageYears: null, source: "profile" };
    out.needsClarification = null;
    notes.push(`Assumed ${a[0].toUpperCase()}${a.slice(1)} from your profile`);
  }

  if (!out.price && taste.budget && (taste.budget.min || taste.budget.max)) {
    out.price = { min: taste.budget.min ?? null, max: taste.budget.max ?? null, strength: "prefer" };
    notes.push(`Preferring ${taste.budget.min ? inr(taste.budget.min) : "₹0"}–${taste.budget.max ? inr(taste.budget.max) : "any"}`);
  }

  if (taste.onlyMySize && !out.sizes) {
    const depts = new Set(out.categories.include.map((c) => tax.department(c)));
    const slot = [...depts].map((d) => (d ? SIZE_SLOT[d] : undefined)).find(Boolean);
    const size = slot ? taste.sizes[slot] : undefined;
    if (size) {
      out.sizes = { values: [size], strength: "must" };
      notes.push(`Only size ${size}`);
    }
  }

  // Avoids are soft: they steer the reranker, never filter (hard filters come from the user's words only).
  const avoid = [...taste.avoidColors, ...taste.avoidFabrics].filter(
    (x) => !out.softPreferences.includes(`avoid ${x}`) && !out.colors.include.includes(x) && !out.fabrics.include.includes(x),
  );
  if (avoid.length) {
    out.softPreferences = [...out.softPreferences, ...avoid.map((x) => `avoid ${x}`)];
    notes.push(`Avoiding ${avoid.join(", ")}`);
  }
  return { intent: out, notes };
}
