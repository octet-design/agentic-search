import { ShopifyError } from "@/lib/shopify/client";
import { getCountry, isCountryCode } from "@/lib/shopify/countries";
import { getShopifyEnv } from "@/lib/shopify/env";
import { searchFashion } from "@/lib/shopify/search";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const num = (v: string | null) => (v && Number.isFinite(Number(v)) && Number(v) >= 0 ? Number(v) : null);

/**
 * GET ?q=linen+shirt&cursor=…&country=IN&min=500&max=3000&local=1&like=<id>&shop=<shop gid> → a page of fashion results.
 * Used by "Load more" on /shopify, Aura's results grid, similar items and "More from this brand".
 */
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const q = (params.get("q") ?? "").trim().slice(0, 200);
  if (!q && !params.get("like") && !params.get("shop")) return Response.json({ message: "Pass ?q=, ?like= or ?shop=" }, { status: 400 });
  const c = params.get("country");
  const country = getCountry(isCountryCode(c) ? c : getShopifyEnv().SHOPIFY_COUNTRY);
  const exclude = new Set((params.get("exclude") ?? "").split(",").filter((s) => /^[\w-]{1,64}$/.test(s)).slice(0, 100));
  try {
    const page = await searchFashion(
      {
        query: q,
        min: num(params.get("min")),
        max: num(params.get("max")),
        local: params.get("local") === "1",
        like: /^[\w-]{1,64}$/.test(params.get("like") ?? "") ? params.get("like") : null,
        shop: /^gid:\/\/shopify\/Shop\/\d+$/.test(params.get("shop") ?? "") ? params.get("shop") : null,
      },
      country,
      { cursor: params.get("cursor"), limit: 24, exclude },
    );
    return Response.json(page);
  } catch (err) {
    console.error("[shopify] search failed:", err);
    const message = err instanceof ShopifyError ? err.message : "Shopify search failed. Please try again.";
    return Response.json({ message }, { status: 502 });
  }
}
