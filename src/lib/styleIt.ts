/**
 * "Style it": occasions a product works for, and for each one real catalog pieces that complete the look
 * (footwear, bag, jewellery…). One cached LLM plan per product; looks are retrieved per occasion on demand.
 */
import { z } from "zod";
import { resolveCategories } from "./agent/chatAgent";
import { sanitizeIntent, mergeIntent } from "./agent/intent";
import { retrieveRails } from "./agent/retrieve";
import { getTaxonomy, type TaxonomyApi } from "./agent/taxonomy";
import { emptyIntent, type Intent, type ProductCard, type RawProduct } from "./agent/types";
import { hashKey, namedCache } from "./cache";
import { cleanText } from "./agent/cleanText";
import { getEnv } from "./env";
import { llmStructured, Usage } from "./llm";
import { getProducts, getRawProducts } from "./products";

const ItemSchema = z.object({ label: z.string(), categories: z.array(z.string()), colors: z.array(z.string()), semanticQuery: z.string(), why: z.string() });
const PlanSchema = z.object({ occasions: z.array(z.object({ name: z.string(), note: z.string(), items: z.array(ItemSchema) })) });
type StylePlan = z.infer<typeof PlanSchema>;

export type StyleLookItem = { label: string; why: string; product: ProductCard };
export type StyleItResult = {
  piece: ProductCard;
  occasions: { name: string; note: string }[];
  occasion: string;
  note: string;
  look: StyleLookItem[];
};

const plans = namedCache<StylePlan>("style-it-plan", 500, 6 * 60 * 60_000);
const looks = namedCache<StyleLookItem[]>("style-it-look", 1000, 60 * 60_000);

let system: string | null = null;
function prompt(tax: TaxonomyApi): string {
  system ??= `You are a stylist for Indian shoppers. Given one product, show how to style it.
Return 3 distinct occasions where this piece genuinely works (names of 1–3 words, e.g. "Office day", "Sangeet night", "Brunch date", "Temple visit"), most natural first. For each:
- note: ≤ 20 words on how to style the piece for that occasion.
- items: 3 complementary pieces from OTHER categories that complete the look (never the piece's own category). For a dress: footwear, bag, jewellery. For a kurta: bottoms, juttis or sandals, a dupatta or jewellery. For a shirt: trousers, shoes, a watch or belt. For footwear or a bag: the outfit and one accessory. Each item:
  label (shown to the user: "Footwear", "Handbag", "Jewellery", "Bottoms", "Watch", "Dupatta"…),
  categories (1–2 canonical CATEGORY ids from the vocabulary that are exactly that kind of item: "Bottoms" → churidar/trouser/salwar, never a full set like sherwani or kurta-set),
  colors (0–2 canonical colour ids that pair with the piece for this occasion),
  semanticQuery (clean English, 5–10 words: colour, material, style, e.g. "gold kundan jhumka earrings festive"),
  why (≤ 12 words: why it works with this piece).
Match the piece's audience (women's piece → women's items). For men, prefer watches, belts, pocket squares, stoles, a kada or cufflinks over necklaces and earrings. Keep the price level in the same range as the piece: complements shouldn't cost more than the piece itself.

Vocabulary (canonical ids):
${tax.promptVocabulary()}`;
  return system;
}

/** Catalog gender → the audience the look is built for. */
function audienceOf(raw: RawProduct, tax: TaxonomyApi): Intent["audience"] {
  const a = tax.data.genderMap[raw.gender as keyof typeof tax.data.genderMap] ?? null;
  if (a === "girls" || a === "boys") return { segment: "kids", kidGender: a === "girls" ? "girl" : "boy", ageYears: null, source: "explicit" };
  if (a === "kids") return { segment: "kids", kidGender: "any", ageYears: null, source: "explicit" };
  if (a === "women" || a === "men" || a === "unisex") return { segment: a, kidGender: null, ageYears: null, source: "explicit" };
  return { segment: "unknown", kidGender: null, ageYears: null, source: "unknown" };
}

async function planFor(raw: RawProduct, tax: TaxonomyApi, usage: Usage): Promise<StylePlan> {
  const hit = plans.get(raw.id);
  if (hit) return hit;
  const plan = await llmStructured({
    name: "style-it",
    model: getEnv().OPENAI_MODEL_FAST,
    schema: PlanSchema,
    system: prompt(tax),
    user: `Product: ${raw.title} | brand ${raw.brand} | category ${raw.category} | ${raw.gender} | colour ${raw.color} | fabric ${raw.fabric ?? "?"} | pattern ${raw.pattern ?? "?"} | fit ${raw.fit ?? "?"} | occasions ${(raw.use_case ?? []).join(", ") || "?"} | ₹${Math.round(raw.price)}\n${cleanText(raw.description).slice(0, 300)}`,
    usage,
    timeoutMs: 20_000,
  });
  const clean = { occasions: plan.occasions.filter((o) => o.name.trim() && o.items.length).slice(0, 3) };
  plans.set(raw.id, clean);
  return clean;
}

export async function styleIt(opts: { id: string; occasion?: string }): Promise<StyleItResult | null> {
  const tax = getTaxonomy();
  const usage = new Usage();
  const [raw] = await getRawProducts([opts.id]);
  const [piece] = await getProducts([opts.id]);
  if (!raw || !piece) return null;
  const plan = await planFor(raw, tax, usage);
  const occ = plan.occasions.find((o) => o.name === opts.occasion) ?? plan.occasions[0];
  if (!occ) return null;
  const occasions = plan.occasions.map((o) => ({ name: o.name, note: o.note }));

  const key = hashKey(raw.id, occ.name);
  let look = looks.get(key);
  if (!look) {
    const audience = audienceOf(raw, tax);
    const pieceCats = new Set(tax.classify("category", raw.category));
    const items = occ.items
      .map((it) => ({ ...it, categories: resolveCategories(it.categories, tax).filter((c) => !pieceCats.has(c)) }))
      .filter((it) => it.categories.length)
      .slice(0, 4);
    // Complements stay near the piece's price level; the relaxation ladder can lift the cap if nothing fits.
    const priceCap = Math.max(1000, Math.round(raw.price * 1.5));
    const rails = await retrieveRails(
      items.map((it, i) => ({
        id: String(i),
        perPage: 20,
        intent: sanitizeIntent(
          mergeIntent(emptyIntent(it.semanticQuery), {
            kind: "product",
            semanticQuery: it.semanticQuery,
            audience,
            categories: { include: it.categories, exclude: [], strength: "must" },
            colors: { include: it.colors, exclude: [], strength: "prefer" },
            price: { min: null, max: priceCap, strength: "must" },
          }),
          tax,
        ),
      })),
      tax,
    );
    const used = new Set([raw.id]);
    look = [];
    rails.forEach((r, i) => {
      const p = r.products.find((x) => !used.has(x.id));
      if (!p) return;
      used.add(p.id);
      look!.push({ label: items[i].label, why: items[i].why, product: p });
    });
    looks.set(key, look);
  }
  if (process.env.NODE_ENV !== "test" && usage.calls.length) {
    console.log(JSON.stringify({ at: new Date().toISOString(), event: "style-it", id: raw.id, occasion: occ.name, tokens: { in: usage.in, out: usage.out }, costUsd: +usage.costUsd.toFixed(5) }));
  }
  return { piece, occasions, occasion: occ.name, note: occ.note, look };
}
