import { searchCatalog, ShopifyError } from "@/lib/shopify/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET ?q=linen+shirt&cursor=… → next page of Shopify Global Catalog results (used by "Load more"). */
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const q = (params.get("q") ?? "").trim().slice(0, 200);
  const cursor = params.get("cursor");
  if (!q) return Response.json({ message: "Pass ?q=" }, { status: 400 });
  try {
    return Response.json(await searchCatalog(q, cursor));
  } catch (err) {
    console.error("[shopify] search failed:", err);
    const message = err instanceof ShopifyError ? err.message : "Shopify search failed. Please try again.";
    return Response.json({ message }, { status: 502 });
  }
}
