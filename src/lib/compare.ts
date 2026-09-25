/** Product comparison: table data + occasion matrix + text verdict. Used by /api/compare and the chat. */
import { z } from "zod";
import { getEnv } from "./env";
import { llmStructured, type Usage } from "./llm";
import { cleanText } from "./agent/cleanText";
import { toCard } from "./agent/retrieve";
import { getTaxonomy } from "./agent/taxonomy";
import type { ProductCard } from "./agent/types";
import { getRawProducts } from "./products";

export type Fit = "great" | "ok" | "poor";
export type OccasionRow = { occasion: string; best: number | null; fits: { fit: Fit; note: string }[] };
export type CompareResult = { products: ProductCard[]; occasions: OccasionRow[]; verdict: string[]; summary: string };

const LETTERS = ["A", "B", "C"];

const CompareSchema = z.object({
  summary: z.string(),
  occasions: z.array(
    z.object({
      occasion: z.string(),
      best: z.enum(["A", "B", "C", "none"]),
      fits: z.array(z.object({ product: z.enum(["A", "B", "C"]), fit: z.enum(["great", "ok", "poor"]), note: z.string() })),
    }),
  ),
  verdict: z.array(z.string()),
});

const SYSTEM = `You are a fashion stylist comparing 2–3 products for an Indian shopper.
Return:
- summary: 1–2 sentences on how they differ overall.
- occasions: 4–6 occasions or events that matter for these products and the shopper's context (e.g. Office, Wedding guest, Festive puja, Casual outing, Date night, Travel, College, Monsoon days). For each: a fit per product (great / ok / poor) with a ≤ 8-word note, and "best" = the letter of the best pick (or "none").
- verdict: 2–3 bullets like "Pick A if …", "Pick B if …".
Use the product data plus general fashion knowledge (fabric comfort, formality, weather, styling). Don't state stock, delivery, discounts or ratings. Mention prices as ₹1,999.`;

export async function compareProducts(opts: { ids: string[]; query?: string; criterion?: string; usage?: Usage; signal?: AbortSignal }): Promise<CompareResult> {
  const raw = await getRawProducts(opts.ids);
  const byId = new Map(raw.map((r) => [r.id, r]));
  const ordered = opts.ids.map((id) => byId.get(id)).filter((r): r is NonNullable<typeof r> => !!r).slice(0, 3);
  if (ordered.length < 2) throw new Error("Some of these products are no longer available.");
  const tax = getTaxonomy();
  const products = ordered.map((r) => toCard(r, 0, tax));
  const res = await llmStructured({
    name: "compare",
    model: getEnv().OPENAI_MODEL_FAST,
    schema: CompareSchema,
    system: SYSTEM,
    user: `${opts.query ? `Shopper's context: ${opts.query}\n` : ""}${opts.criterion ? `They care about: ${opts.criterion}\n` : ""}${ordered
      .map(
        (r, i) =>
          `${LETTERS[i]}: ${cleanText(r.title)} | ${products[i].brand} | ₹${Math.round(r.price)} | colour ${r.color} | fabric ${r.fabric ?? "?"} | fit ${r.fit ?? "?"} | pattern ${r.pattern ?? "?"} | occasions ${(r.use_case ?? []).join(", ")} | ${cleanText(r.description).slice(0, 160)}`,
      )
      .join("\n")}`,
    usage: opts.usage,
    signal: opts.signal,
    timeoutMs: 35_000,
  });
  return { products, ...normalizeCompare(res, products.length) };
}

/** Maps letters to indexes and fills gaps so every row has one fit per product. Pure; unit-tested. */
export function normalizeCompare(res: z.infer<typeof CompareSchema>, n: number): Omit<CompareResult, "products"> {
  const idx = (l: string) => LETTERS.indexOf(l);
  const occasions = res.occasions.slice(0, 6).map((o) => {
    const fits = Array.from({ length: n }, (_, i) => {
      const f = o.fits.find((x) => idx(x.product) === i);
      return f ? { fit: f.fit, note: f.note } : { fit: "ok" as Fit, note: "" };
    });
    const best = o.best === "none" ? null : idx(o.best);
    return { occasion: o.occasion, best: best != null && best >= 0 && best < n ? best : null, fits };
  });
  return { occasions, verdict: res.verdict.slice(0, 3), summary: res.summary };
}
