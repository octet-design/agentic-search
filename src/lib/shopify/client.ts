import { getShopifyEnv } from "./env";
import { type Product, ProductResult, SearchResult, type ShopifyCard, type ShopifyPage } from "./types";

/** Server-only. Shopify Global Catalog over MCP (JSON-RPC 2.0). No API key: Shopify identifies us by our UCP agent profile URL. */

export class ShopifyError extends Error {}

const GID_PREFIX = "gid://shopify/p/";
export const shortId = (gid: string) => (gid.startsWith(GID_PREFIX) ? gid.slice(GID_PREFIX.length) : gid);
export const isShortId = (s: string) => /^[\w-]{1,64}$/.test(s);

let rpcId = 0;

/** `currency` also sets the unit of price filters (Shopify otherwise reads them as USD). */
type CallOpts = { country?: string; currency?: string; signal?: AbortSignal };

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => (clearTimeout(t), reject(signal.reason)), { once: true });
  });

async function callTool(name: string, catalog: Record<string, unknown>, opts: CallOpts = {}, attempt = 0): Promise<unknown> {
  const env = getShopifyEnv();
  const timeout = AbortSignal.timeout(20_000);
  const res = await fetch(env.SHOPIFY_CATALOG_URL, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: ++rpcId,
      method: "tools/call",
      params: {
        name,
        arguments: {
          meta: { "ucp-agent": { profile: env.SHOPIFY_UCP_PROFILE_URL } },
          catalog: { ...catalog, context: { address_country: opts.country ?? env.SHOPIFY_COUNTRY, ...(opts.currency ? { currency: opts.currency } : {}) } },
        },
      },
    }),
    cache: "no-store",
    signal: opts.signal ? AbortSignal.any([timeout, opts.signal]) : timeout,
  });
  // Rate limited: wait what Shopify asks (max 3s) and retry once.
  if (res.status === 429 && attempt === 0) {
    const wait = Math.min(3000, Math.max(500, Number(res.headers.get("retry-after")) * 1000 || 1000));
    await sleep(wait, opts.signal);
    return callTool(name, catalog, opts, 1);
  }
  if (res.status === 429) throw new ShopifyError("Shopify is busy right now. Please try again in a moment.");
  if (!res.ok) throw new ShopifyError(`Shopify catalog returned HTTP ${res.status}`);
  const body = (await res.json()) as {
    error?: { message?: string; data?: { content?: string } };
    result?: { isError?: boolean; structuredContent?: unknown; content?: { text?: string }[] };
  };
  if (body.error) throw new ShopifyError(body.error.data?.content ?? body.error.message ?? "Shopify catalog error");
  if (body.result?.isError) throw new ShopifyError(body.result.content?.[0]?.text ?? "Shopify catalog error");
  return body.result?.structuredContent;
}

export function toCard(p: Product): ShopifyCard {
  const v = p.variants[0];
  const min = p.price_range?.min ?? v?.price ?? null;
  const opts = (v?.options ?? []).filter((o) => !(o.name === "Title" && o.label === "Default Title"));
  return {
    id: shortId(p.id),
    title: p.title,
    image: p.media[0]?.url ?? v?.media[0]?.url ?? null,
    price: min,
    priceFrom: !!p.price_range && p.price_range.min.amount !== p.price_range.max.amount,
    seller: v?.seller?.name ?? null,
    rating: p.rating ? { value: p.rating.value, count: p.rating.count ?? null } : null,
    features: (p.metadata?.top_features ?? []).slice(0, 3),
    url: v?.url ?? null,
    checkoutUrl: v?.checkout_url ?? null,
    defaultOptions: opts.length ? opts.map((o) => o.label).join(" / ") : null,
  };
}

export type SearchOpts = CallOpts & {
  cursor?: string | null;
  limit?: number;
  /** Price bounds in minor units of `currency` (pass it, or Shopify reads them as USD). */
  price?: { min?: number; max?: number };
  /** Only products shipped from these countries (e.g. local brands). */
  shipsFrom?: string[];
  /** Shopify taxonomy category ids (OR). */
  categories?: string[];
};

export async function searchCatalog(query: string, opts: SearchOpts = {}): Promise<ShopifyPage> {
  const country = opts.country ?? getShopifyEnv().SHOPIFY_COUNTRY;
  const filters: Record<string, unknown> = { ships_to: { country } };
  if (opts.price && (opts.price.min != null || opts.price.max != null)) filters.price = opts.price;
  if (opts.shipsFrom?.length) filters.ships_from = opts.shipsFrom.map((c) => ({ country: c }));
  if (opts.categories?.length) filters.categories = opts.categories;
  const raw = await callTool(
    "search_catalog",
    { query, filters, pagination: { limit: opts.limit ?? 24, ...(opts.cursor ? { cursor: opts.cursor } : {}) } },
    { country, currency: opts.currency, signal: opts.signal },
  );
  const parsed = SearchResult.parse(raw);
  return {
    products: parsed.products.map(toCard),
    cursor: parsed.pagination?.cursor ?? null,
    hasNext: parsed.pagination?.has_next_page ?? false,
    total: parsed.pagination?.total_count ?? null,
  };
}

/** Full product; `selected` picks the variant (e.g. [{ name: "Size", label: "M" }]). */
export async function getProduct(id: string, selected: { name: string; label: string }[] = [], opts: CallOpts = {}): Promise<Product | null> {
  const raw = await callTool("get_product", { id: GID_PREFIX + id, ...(selected.length ? { selected } : {}) }, opts);
  return ProductResult.parse(raw).product ?? null;
}
