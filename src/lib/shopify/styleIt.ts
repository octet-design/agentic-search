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
type StylePlan = z.infer<typeof PlanSchema>;

export type StyleLookItem = { label: string; why: string; product: ShopifyCard };
export type StyleItResult = {
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

async function planFor(v: ProductView, country: Country, signal?: AbortSignal): Promise<StylePlan> {
  const key = `${v.id}:${country.code}`;
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
        { role: "system", content: SYSTEM },
        { role: "user", content: `${facts.join(" | ")}\n${(v.description ?? "").slice(0, 400)}` },
      ],
      response_format: zodResponseFormat(PlanSchema, "style_it"),
      ...(isReasoning(model) ? { reasoning_effort: "low" as const } : { temperature: 0.4 }),
    },
    { timeout: 20_000, maxRetries: 1, signal },
  );
  const parsed = res.choices[0]?.message.parsed;
  if (!parsed) throw new Error("style-it: no plan");
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

export async function styleIt(opts: { id: string; country: Country; occasion?: string; signal?: AbortSignal }): Promise<StyleItResult | null> {
  const { id, country } = opts;
  let v = pieces.get(`${id}:${country.code}`);
  if (!v) {
    const p = await getProduct(id, [], { country: country.code, currency: country.currency, signal: opts.signal });
    if (!p) return null;
    v = toProductView(id, p);
    pieces.set(`${id}:${country.code}`, v);
  }
  const piece: ShopifyCard = { ...cardFromView(v), defaultOptions: null };

  const plan = await planFor(v, country, opts.signal);
  const occ = plan.occasions.find((o) => o.name === opts.occasion) ?? plan.occasions[0];
  if (!occ) return null;

  const key = `${id}:${country.code}:${occ.name}`;
  let look = looks.get(key);
  if (!look) {
    const max = priceCap(v, country);
    const pages = await Promise.all(
      occ.items.map((it) =>
        searchFashion({ query: it.query, min: null, max, local: false }, country, { limit: 10, exclude: new Set([id]), signal: opts.signal }).catch(() => null),
      ),
    );
    const used = new Set([id]);
    look = [];
    pages.forEach((page, i) => {
      const hit = page?.products.find((x) => !used.has(x.id));
      if (!hit) return;
      used.add(hit.id);
      look!.push({ label: occ.items[i].label, why: occ.items[i].why, product: hit });
    });
    looks.set(key, look);
  }

  return { piece, occasions: plan.occasions.map((o) => ({ name: o.name, note: o.note })), occasion: occ.name, note: occ.note, look };
}
