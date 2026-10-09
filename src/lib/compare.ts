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
/** Product-specific spec rows (Scout): e.g. a tumbler's Capacity / Material / Insulation, one value per product. */
export type AttributeRow = { name: string; values: string[] };
export type CompareResult = { products: ProductCard[]; occasions: OccasionRow[]; verdict: string[]; summary: string; attributes?: AttributeRow[] };

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

const SYSTEM = `You are an expert shopping assistant comparing 2–3 products for an Indian shopper.
Return:
- summary: 1–2 sentences on how they differ overall.
- occasions: 4–6 occasions, events or use cases that matter for these products and the shopper's context. For clothing and accessories, occasions (e.g. Office, Wedding guest, Festive puja, Casual outing, Date night, Travel); for other products, use cases (e.g. for headphones: Daily commute, Work calls, Gym, Long flights). For each: a fit per product (great / ok / poor) with a ≤ 8-word note, and "best" = the letter of the best pick (or "none").
- verdict: 2–3 bullets like "Pick A if …", "Pick B if …".
Use the product data plus general product knowledge (materials, comfort, build, features, formality, weather). Don't state stock, delivery or discounts. Mention prices as ₹1,999.`;

/** Scout compares any product: the model also picks the spec rows that matter for this kind of product. */
const GeneralSchema = CompareSchema.extend({ attributes: z.array(z.object({ name: z.string(), values: z.array(z.string()) })) });
const ATTRIBUTES_RULE = `
- attributes: the 4–6 specs that matter most when choosing this kind of product, in order of importance (a tumbler: Capacity, Material, Insulation, Lid type, Weight; headphones: Type, Battery life, Noise cancelling, Connectivity, Weight; clothing: Fabric, Fit, Pattern, Colour). Don't repeat price or brand. values = one short value per product (≤ 5 words) in the A, B, C order, taken only from the data given; write "—" when it isn't stated. Never guess numbers.`;

/** A product that isn't in our catalog (e.g. from a partner store): its card plus a line of live facts. */
export type CompareExtra = { id: string; card: ProductCard; facts: string };

export async function compareProducts(opts: {
  ids: string[];
  /** Products not in our catalog, with their own card and facts (the caller fetches them). */
  extra?: CompareExtra[];
  query?: string;
  criterion?: string;
  /** Any kind of product (Scout): adds product-specific spec rows instead of the fashion ones. */
  general?: boolean;
  usage?: Usage;
  signal?: AbortSignal;
}): Promise<CompareResult> {
  const extra = new Map((opts.extra ?? []).map((x) => [x.id, x]));
  const raw = await getRawProducts(opts.ids.filter((id) => !extra.has(id)));
  const byId = new Map(raw.map((r) => [r.id, r]));
  const tax = getTaxonomy();
  // Each product as a card plus one line of data for the model, in the order asked.
  const rows = opts.ids
    .map((id) => {
      const x = extra.get(id);
      if (x) return { card: x.card, line: `${cleanText(x.card.title)} | ${x.card.brand} | ₹${Math.round(x.card.price)} | ${x.facts}` };
      const r = byId.get(id);
      if (!r) return null;
      const card = toCard(r, 0, tax);
      return {
        card,
        line: `${cleanText(r.title)} | ${card.brand} | ₹${Math.round(r.price)} | colour ${r.color} | fabric ${r.fabric ?? "?"} | fit ${r.fit ?? "?"} | pattern ${r.pattern ?? "?"} | occasions ${(r.use_case ?? []).join(", ")} | ${cleanText(r.description).slice(0, 160)}`,
      };
    })
    .filter((x): x is NonNullable<typeof x> => !!x)
    .slice(0, 3);
  if (rows.length < 2) throw new Error("Some of these products are no longer available.");
  const products = rows.map((x) => x.card);
  const res = await llmStructured({
    name: "compare",
    model: getEnv().OPENAI_MODEL_FAST,
    schema: opts.general ? GeneralSchema : CompareSchema,
    system: opts.general ? SYSTEM + ATTRIBUTES_RULE : SYSTEM,
    user: `${opts.query ? `Shopper's context: ${opts.query}\n` : ""}${opts.criterion ? `They care about: ${opts.criterion}\n` : ""}${rows.map((x, i) => `${LETTERS[i]}: ${x.line}`).join("\n")}`,
    usage: opts.usage,
    signal: opts.signal,
    timeoutMs: 35_000,
  });
  const attributes = "attributes" in res ? normalizeAttributes(res.attributes as AttributeRow[], products.length) : undefined;
  return { products, ...normalizeCompare(res, products.length), ...(attributes?.length ? { attributes } : {}) };
}

/** One value per product (missing → "—"), at most 6 rows, empty rows dropped. Pure; unit-tested. */
export function normalizeAttributes(rows: AttributeRow[], n: number): AttributeRow[] {
  return rows
    .filter((r) => r.name.trim())
    .map((r) => ({ name: r.name.trim(), values: Array.from({ length: n }, (_, i) => r.values[i]?.trim() || "—") }))
    .filter((r) => r.values.some((v) => v !== "—"))
    .slice(0, 6);
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
