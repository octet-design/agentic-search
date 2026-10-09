/**
 * "Style it" for Shopify products: 3 occasions the piece works for and, per occasion, real pieces from
 * other stores that complete the look. One cached LLM plan per product+country; looks are searched per
 * occasion on demand. Mirrors Drape's Style it, built on the Shopify catalog.
 */
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import { isReasoning, openai } from "./agent/llm";
import { getProduct } from "./client";
import type { Country } from "./countries";
import { getShopifyEnv } from "./env";
import { money } from "./format";
import { isNonFashionQuery, searchFashion } from "./search";
import type { ShopifyCard } from "./types";
import { cardFromView, toProductView, type ProductView } from "./view";

const ItemSchema = z.object({ label: z.string(), query: z.string(), why: z.string() });
const PlanSchema = z.object({ occasions: z.array(z.object({ name: z.string(), note: z.string(), items: z.array(ItemSchema) })) });
/** Any product (Scout): fashion gets occasions; anything else gets "goes well with" complementary items. */
const GeneralPlanSchema = PlanSchema.extend({ fashion: z.boolean(), pairs: z.array(ItemSchema) });
type StylePlan = z.infer<typeof PlanSchema> & { pairs?: z.infer<typeof ItemSchema>[] };

export type StyleLookItem = { label: string; why: string; product: ShopifyCard };
export type StyleItResult = {
  /** "style": occasions + a complete look (fashion). "pairs": things that go well with it (any other product). */
  kind: "style" | "pairs";
  piece: ShopifyCard;
  occasions: { name: string; note: string }[];
  occasion: string;
  note: string;
  look: StyleLookItem[];
};

/** Tiny in-memory TTL cache (per server instance). */
function ttlCache<T>(max: number, ttlMs: number) {
  const m = new Map<string, { at: number; v: T }>();
  return {
    get(k: string): T | undefined {
      const hit = m.get(k);
      if (!hit || Date.now() - hit.at > ttlMs) return undefined;
      return hit.v;
    },
    set(k: string, v: T) {
      if (m.size >= max) m.delete(m.keys().next().value!);
      m.set(k, { at: Date.now(), v });
    },
  };
}
const plans = ttlCache<StylePlan>(500, 6 * 60 * 60_000);
// The piece itself, so switching occasions needs no Shopify call.
const pieces = ttlCache<ProductView>(500, 30 * 60_000);
const looks = ttlCache<StyleLookItem[]>(1000, 60 * 60_000);

const SYSTEM = `You are a fashion stylist. Given one product, show how to style it.
Return 3 distinct occasions where this piece genuinely works (names of 1-3 words, e.g. "Office day", "Brunch date", "Sangeet night", "Beach holiday"), most natural first. For each:
- note: at most 20 words on how to style the piece for that occasion.
- items: 3 complementary FASHION pieces from OTHER categories that complete the look (never the piece's own category). For a dress: footwear, bag, jewellery. For a kurta: bottoms, juttis or sandals, a dupatta or jewellery. For a shirt: trousers, shoes, a watch or belt. For footwear or a bag: the outfit and one accessory. Each item:
  label (shown to the user: "Footwear", "Handbag", "Jewellery", "Bottoms", "Watch", "Belt", "Dupatta"…),
  query (2-6 word English shopping query including who it's for, colour and material, e.g. "tan leather loafers men", "gold hoop earrings women"),
  why (at most 12 words: why it works with this piece).
Match the piece's audience (women's piece → women's items; kids' piece → kids' items). For men prefer watches, belts, stoles, cufflinks over necklaces and earrings. Only fashion items: clothing, footwear, bags, jewellery, watches, eyewear, accessories.`;

const GENERAL_SYSTEM = `First decide whether the product is fashion (clothing, footwear, bags, jewellery, watches, eyewear, fashion accessories): set fashion.
- If fashion: follow the stylist rules below for occasions, and set pairs [].
- If not fashion (a tumbler, headphones, a phone, cookware, skincare, a toy…): set occasions [] and pairs = 3–4 complementary products people buy WITH it: accessories, add-ons, refills, care or protection items (a tumbler → insulated sleeve, spare straw lid, bottle cleaning brush; a phone → case, fast charger, screen protector; a frying pan → silicone spatula set, pan protector). Each: label (shown to the user, e.g. "Sleeve", "Charger"), query (a 2–6 word English shopping query naming the item and, when relevant, the product it fits, e.g. "stanley 40oz tumbler straw lid"), why (at most 12 words).

Stylist rules (fashion only):
`;

async function planFor(v: ProductView, country: Country, general: boolean, signal?: AbortSignal): Promise<StylePlan> {
  const key = `${v.id}:${country.code}:${general ? "any" : "fashion"}`;
  const hit = plans.get(key);
  if (hit) return hit;
  const model = getShopifyEnv().SHOPIFY_AGENT_MODEL;
  const facts = [
    `Product: ${v.title}`,
    v.seller.name && `store ${v.seller.name}`,
    v.price && `price ${money(v.price, country.locale)}`,
    v.options.length && `options ${v.options.map((o) => `${o.name}: ${o.values.map((x) => x.label).slice(0, 6).join("/")}`).join("; ")}`,
    v.highlights.length && `highlights ${v.highlights.slice(0, 4).join("; ")}`,
    v.specs.length && `specs ${v.specs.slice(0, 6).join("; ")}`,
  ].filter(Boolean);
  const res = await openai().chat.completions.parse(
    {
      model,
      messages: [
        { role: "system", content: general ? GENERAL_SYSTEM + SYSTEM : SYSTEM },
        { role: "user", content: `${facts.join(" | ")}\n${(v.description ?? "").slice(0, 400)}` },
      ],
      response_format: general ? zodResponseFormat(GeneralPlanSchema, "style_it") : zodResponseFormat(PlanSchema, "style_it"),
      ...(isReasoning(model) ? { reasoning_effort: "low" as const } : { temperature: 0.4 }),
    },
    { timeout: 20_000, maxRetries: 1, signal },
  );
  const parsed = res.choices[0]?.message.parsed as (z.infer<typeof PlanSchema> & { fashion?: boolean; pairs?: z.infer<typeof ItemSchema>[] }) | null | undefined;
  if (!parsed) throw new Error("style-it: no plan");
  if (general && parsed.fashion === false) {
    const pairs = (parsed.pairs ?? []).filter((it) => it.query.trim()).slice(0, 4);
    const plan: StylePlan = { occasions: [], pairs };
    plans.set(key, plan);
    return plan;
  }
  const clean = {
    occasions: parsed.occasions
      .filter((o) => o.name.trim())
      .map((o) => ({ ...o, items: o.items.filter((it) => it.query.trim() && !isNonFashionQuery(it.query)).slice(0, 4) }))
      .filter((o) => o.items.length)
      .slice(0, 3),
  };
  plans.set(key, clean);
  return clean;
}

/** Complements stay near the piece's price level (never below a small floor, so cheap pieces still find matches). */
function priceCap(v: ProductView, country: Country): number | null {
  if (!v.price) return null;
  const digits = new Intl.NumberFormat("en", { style: "currency", currency: v.price.currency }).resolvedOptions().maximumFractionDigits ?? 2;
  const major = v.price.amount / 10 ** digits;
  const floor = country.currency === "INR" ? 1000 : country.currency === "JPY" ? 2000 : 20;
  return Math.max(floor, Math.round(major * 1.5));
}

/** `general` (Scout): any product; non-fashion gets "goes well with" items, searched across every category from local sellers. */
export async function styleIt(opts: { id: string; country: Country; occasion?: string; general?: boolean; signal?: AbortSignal }): Promise<StyleItResult | null> {
  const { id, country } = opts;
  let v = pieces.get(`${id}:${country.code}`);
  if (!v) {
    const p = await getProduct(id, [], { country: country.code, currency: country.currency, signal: opts.signal });
    if (!p) return null;
    v = toProductView(id, p);
    pieces.set(`${id}:${country.code}`, v);
  }
  const piece: ShopifyCard = { ...cardFromView(v), defaultOptions: null };

  const general = !!opts.general;
  const plan = await planFor(v, country, general, opts.signal);
  if (plan.pairs?.length) return { kind: "pairs", piece, occasions: [], occasion: "", note: "", look: await lookFor(`${id}:${country.code}:pairs`, plan.pairs, v, country, general, opts.signal) };
  const occ = plan.occasions.find((o) => o.name === opts.occasion) ?? plan.occasions[0];
  if (!occ) return null;

  const look = await lookFor(`${id}:${country.code}:${general ? "any" : "fashion"}:${occ.name}`, occ.items, v, country, general, opts.signal);
  return { kind: "style", piece, occasions: plan.occasions.map((o) => ({ name: o.name, note: o.note })), occasion: occ.name, note: occ.note, look };
}

const words = (t: string) => new Set(t.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 1));
/** Two titles name the same product when most of their words overlap (Jaccard ≥ 0.5). Pure; unit-tested. */
export function sameProduct(a: string, b: string): boolean {
  const x = words(a);
  const y = words(b);
  const both = [...x].filter((w) => y.has(w)).length;
  const any = new Set([...x, ...y]).size;
  return any > 0 && both / any >= 0.5;
}

/** One real product per planned item (cached). Scout searches every category, from local sellers only. */
async function lookFor(key: string, items: z.infer<typeof ItemSchema>[], v: ProductView, country: Country, general: boolean, signal?: AbortSignal): Promise<StyleLookItem[]> {
  const hit = looks.get(key);
  if (hit) return hit;
  const max = priceCap(v, country);
  const pages = await Promise.all(
    items.map((it) =>
      searchFashion({ query: it.query, min: null, max, local: general, allCategories: general }, country, { limit: 10, exclude: new Set([v.id]), signal }).catch(() => null),
    ),
  );
  const used = new Set([v.id]);
  const look: StyleLookItem[] = [];
  pages.forEach((page, i) => {
    // Stores relist the same product (or a sleeve-length variant): a complement must be something else.
    const found = page?.products.find((x) => !used.has(x.id) && !sameProduct(x.title, v.title));
    if (!found) return;
    used.add(found.id);
    look.push({ label: items[i].label, why: items[i].why, product: found });
  });
  looks.set(key, look);
  return look;
}
