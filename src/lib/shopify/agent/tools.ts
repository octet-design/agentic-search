import type { ChatCompletionTool } from "openai/resources/chat/completions";
import { z } from "zod";
import { getProduct, ShopifyError } from "../client";
import type { Country } from "../countries";
import { money } from "../format";
import { isNonFashionQuery, searchFashion } from "../search";
import type { ShopifyCard } from "../types";
import { toProductView } from "../view";
import type { CompareItem, Emit, Excluded, Shown } from "./types";

const Options = {
  type: ["array", "null"],
  description: "Variant to check, e.g. [{name:'Size', label:'M'}], or null for the default.",
  items: { type: "object", additionalProperties: false, required: ["name", "label"], properties: { name: { type: "string" }, label: { type: "string" } } },
} as const;

/** Tools the model can call. The buyer country is never a parameter: the server always applies it. */
export const TOOLS: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "search_products",
      description: "Search FASHION products only (clothing, footwear, bags, jewellery, watches, eyewear, accessories) from online stores that deliver to the shopper. Never use it for electronics, home, beauty or other non-fashion items. Results appear to the shopper as a row of product cards under `title` and `why`.",
      strict: true,
      parameters: {
        type: "object",
        additionalProperties: false,
        required: ["title", "why", "query", "like_ref", "min_price", "max_price", "local_brands_only", "remembered"],
        properties: {
          title: { type: "string", description: "Short row heading, e.g. 'Linen shirts under ₹3,000'." },
          why: { type: "string", description: "One short line under the heading on why this row fits, e.g. 'Breathable for a beach wedding'." },
          query: { type: "string", description: "2-5 word English product query including who it's for, e.g. 'linen shirt men'. Ignored when like_ref is set." },
          like_ref: { type: ["integer", "null"], description: "For 'more like this': the ref of a shown product to find look-alikes of; otherwise null." },
          min_price: { type: ["number", "null"], description: "Minimum price in whole units of the shopper's currency, or null." },
          max_price: { type: ["number", "null"], description: "Maximum price in whole units of the shopper's currency, or null." },
          local_brands_only: { type: "boolean", description: "True only if the shopper asked for brands/stores from their own country." },
          remembered: {
            type: "array",
            items: { type: "string" },
            description: "The shopper's standing preferences for this chat so far, as short labels (e.g. 'Under ₹3,000', 'Size M', 'No polyester', 'Pastels'). Keep earlier ones unless the shopper dropped or changed them.",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_product_details",
      description: "Full details for a product already shown in this chat: options (sizes, colours) with stock, features, specs, description and store policies. Pass options to check a specific variant.",
      strict: true,
      parameters: {
        type: "object",
        additionalProperties: false,
        required: ["ref", "options"],
        properties: { ref: { type: "integer", description: "The product's ref number (#n)." }, options: Options },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "compare_products",
      description: "Show the shopper a side-by-side comparison table of 2-4 products already shown (price, rating, sizes/colours in stock, highlights, returns). Use when they ask to compare or choose between products.",
      strict: true,
      parameters: {
        type: "object",
        additionalProperties: false,
        required: ["refs", "focus"],
        properties: {
          refs: { type: "array", items: { type: "integer" }, description: "2-4 product ref numbers." },
          focus: { type: ["string", "null"], description: "What the shopper cares about most (e.g. 'comfort', 'value'), or null." },
        },
      },
    },
  },
];

const SearchArgs = z.object({
  title: z.string().trim().min(1).max(80),
  why: z.string().trim().max(140),
  // Empty is fine for "more like this" (like_ref); checked in search().
  query: z.string().trim().max(120),
  min_price: z.number().min(0).nullable(),
  max_price: z.number().min(0).nullable(),
  like_ref: z.number().int().nullable(),
  local_brands_only: z.boolean(),
  remembered: z.array(z.string().trim().min(1).max(60)).max(12),
});
const DetailsArgs = z.object({
  ref: z.number().int(),
  options: z.array(z.object({ name: z.string().max(60), label: z.string().max(80) })).max(6).nullable(),
});
const CompareArgs = z.object({ refs: z.array(z.number().int()).min(2).max(4), focus: z.string().max(80).nullable() });


const rating = (r: { value: number; count: number | null } | null) => (r ? `${r.value.toFixed(1)}/5 (${r.count ?? "?"} reviews)` : null);

/** Per-turn state shared by the tool calls: ref numbering, what the chat has shown, the stream. */
export class ToolContext {
  private sections = 0;
  readonly byRef = new Map<number, Shown>();
  private readonly exclude: Set<string>;
  constructor(
    readonly country: Country,
    shown: Shown[],
    excluded: Excluded[],
    public nextRef: number,
    private emit: Emit,
    private signal: AbortSignal,
  ) {
    for (const s of shown) this.byRef.set(s.ref, s);
    this.exclude = new Set(excluded.map((e) => e.id));
  }

  price(c: Pick<ShopifyCard, "price" | "priceFrom">): string {
    return c.price ? `${c.priceFrom ? "from " : ""}${money(c.price, this.country.locale)}` : "price on site";
  }

  async run(name: string, rawArgs: string): Promise<unknown> {
    try {
      const args = JSON.parse(rawArgs || "{}");
      if (name === "search_products") return await this.search(SearchArgs.parse(args));
      if (name === "get_product_details") return await this.details(DetailsArgs.parse(args));
      if (name === "compare_products") return await this.compare(CompareArgs.parse(args));
      return { error: `Unknown tool ${name}` };
    } catch (err) {
      if (this.signal.aborted) throw err;
      console.error(`[finds] ${name} failed:`, err);
      return { error: err instanceof ShopifyError ? err.message : "The tool failed; try again or tell the shopper." };
    }
  }

  private async search(a: z.infer<typeof SearchArgs>) {
    const likeOf = a.like_ref != null ? this.byRef.get(a.like_ref) : undefined;
    if (a.like_ref != null && !likeOf) return { error: `No product #${a.like_ref} in this chat.` };
    if (!likeOf && !a.query) return { error: "Pass a query (or like_ref for look-alikes)." };
    if (!likeOf && isNonFashionQuery(a.query)) {
      return { error: "Out of scope: this is not a fashion item. Don't search again; tell the shopper you only help with fashion right now and offer a fashion angle." };
    }
    const id = `s${++this.sections}-${Date.now().toString(36)}`;
    this.emit({ type: "section_start", id, title: a.title, why: a.why });
    this.emit({ type: "status", label: likeOf ? `Finding pieces like ${likeOf.title.slice(0, 40)}` : `Searching “${a.query}” in ${this.country.name}` });
    if (a.remembered.length) this.emit({ type: "chips", items: a.remembered });

    const search = {
      query: likeOf ? "" : a.query,
      min: a.min_price,
      max: a.max_price,
      local: a.local_brands_only,
      like: likeOf?.id ?? null,
    };
    const page = await searchFashion(search, this.country, { limit: 20, exclude: this.exclude, signal: this.signal });
    const products = page.products.slice(0, 10).map((c) => ({ ...c, ref: this.nextRef++ }));
    for (const p of products) this.byRef.set(p.ref, { ref: p.ref, id: p.id, title: p.title, store: p.seller, price: this.price(p) });

    const note = products.length ? undefined : `Nothing in stock that delivers to ${this.country.name} for this search.`;
    this.emit({ type: "section", id, title: a.title, why: a.why, search, products, hasMore: page.products.length > products.length || page.hasNext, note });

    return {
      shown_to_shopper_as: a.title,
      results: products.map((p) => ({
        ref: p.ref,
        mention_as: `[short name](#${p.ref})`,
        title: p.title,
        store: p.seller,
        price: this.price(p),
        rating: rating(p.rating),
        options: p.defaultOptions,
        highlights: p.features,
      })),
      total_matches: page.total,
      ...(products.length ? {} : { hint: "No results. Try a broader or differently worded query once." }),
    };
  }

  private async details(a: z.infer<typeof DetailsArgs>) {
    const s = this.byRef.get(a.ref);
    if (!s) return { error: `No product #${a.ref} in this chat. Only use refs from search results.` };
    this.emit({ type: "status", label: `Checking details of ${s.title.slice(0, 40)}` });
    const p = await getProduct(s.id, a.options ?? [], { country: this.country.code, currency: this.country.currency, signal: this.signal });
    if (!p) return { error: "This product is no longer available." };
    const v = toProductView(s.id, p);
    return {
      ref: a.ref,
      title: v.title,
      store: v.seller.name,
      selected: v.selected.map((o) => `${o.name}: ${o.label}`),
      price: v.price ? money(v.price, this.country.locale) : null,
      in_stock: v.available,
      options: v.options.map((o) => ({ name: o.name, values: o.values.map((x) => (x.available ? x.label : `${x.label} (sold out)`)) })),
      rating: rating(v.rating),
      highlights: v.highlights.slice(0, 5),
      specs: v.specs.slice(0, 10),
      description: (v.description ?? "").slice(0, 700),
      store_policies_listed: v.seller.policies.map((l) => l.label),
    };
  }

  private async compare(a: z.infer<typeof CompareArgs>) {
    const refs = [...new Set(a.refs)].filter((r) => this.byRef.has(r)).slice(0, 4);
    if (refs.length < 2) return { error: "Need at least 2 products already shown in this chat." };
    this.emit({ type: "status", label: `Comparing ${refs.length} products` });
    const views = await Promise.all(
      refs.map(async (ref) => {
        const s = this.byRef.get(ref)!;
        const p = await getProduct(s.id, [], { country: this.country.code, currency: this.country.currency, signal: this.signal });
        return p ? { ref, v: toProductView(s.id, p) } : null;
      }),
    );
    const items: CompareItem[] = views
      .filter((x): x is NonNullable<typeof x> => !!x)
      .map(({ ref, v }) => ({
        ref,
        id: v.id,
        title: v.title,
        image: v.images[0]?.url ?? null,
        store: v.seller.name,
        price: v.price,
        rating: v.rating,
        available: v.available,
        options: Object.fromEntries(v.options.map((o) => [o.name, o.values.filter((x) => x.available).map((x) => x.label)])),
        highlights: v.highlights.slice(0, 3),
        returnsUrl: v.seller.policies.find((l) => l.label.startsWith("Returns"))?.url ?? null,
        buyUrl: v.buyUrl,
      }));
    if (items.length < 2) return { error: "Couldn't load enough of these products to compare." };
    this.emit({ type: "compare", items, focus: a.focus });
    return {
      shown_to_shopper: "comparison table",
      products: items.map((i) => ({
        ref: i.ref,
        title: i.title,
        store: i.store,
        price: i.price ? money(i.price, this.country.locale) : null,
        rating: rating(i.rating),
        in_stock_options: i.options,
        highlights: i.highlights,
        has_returns_policy: !!i.returnsUrl,
      })),
    };
  }
}
