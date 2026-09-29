import { getShopifyEnv } from "./env";
import { type Product, ProductResult, SearchResult, type ShopifyCard, type ShopifyPage } from "./types";

/** Server-only. Shopify Global Catalog over MCP (JSON-RPC 2.0). No API key: Shopify identifies us by our UCP agent profile URL. */

export class ShopifyError extends Error {}

const GID_PREFIX = "gid://shopify/p/";
export const shortId = (gid: string) => (gid.startsWith(GID_PREFIX) ? gid.slice(GID_PREFIX.length) : gid);
export const isShortId = (s: string) => /^[\w-]{1,64}$/.test(s);

let rpcId = 0;

async function callTool(name: string, catalog: Record<string, unknown>): Promise<unknown> {
  const env = getShopifyEnv();
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
          catalog: { ...catalog, context: { address_country: env.SHOPIFY_COUNTRY } },
        },
      },
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });
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
  return {
    id: shortId(p.id),
    title: p.title,
    image: p.media[0]?.url ?? v?.media[0]?.url ?? null,
    price: min,
    priceFrom: !!p.price_range && p.price_range.min.amount !== p.price_range.max.amount,
    seller: v?.seller?.name ?? null,
    rating: p.rating ? { value: p.rating.value, count: p.rating.count ?? null } : null,
  };
}

export async function searchCatalog(query: string, cursor?: string | null, limit = 24): Promise<ShopifyPage> {
  const raw = await callTool("search_catalog", {
    query,
    pagination: { limit, ...(cursor ? { cursor } : {}) },
  });
  const parsed = SearchResult.parse(raw);
  return {
    products: parsed.products.map(toCard),
    cursor: parsed.pagination?.cursor ?? null,
    hasNext: parsed.pagination?.has_next_page ?? false,
    total: parsed.pagination?.total_count ?? null,
  };
}

/** Full product; `selected` picks the variant (e.g. [{ name: "Size", label: "M" }]). */
export async function getProduct(id: string, selected: { name: string; label: string }[] = []): Promise<Product | null> {
  const raw = await callTool("get_product", { id: GID_PREFIX + id, ...(selected.length ? { selected } : {}) });
  return ProductResult.parse(raw).product ?? null;
}
