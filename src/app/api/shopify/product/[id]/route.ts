import { getProduct, isShortId, ShopifyError } from "@/lib/shopify/client";
import { getCountry, isCountryCode } from "@/lib/shopify/countries";
import { COUNTRY_PARAM } from "@/lib/shopify/format";
import { toProductView } from "@/lib/shopify/view";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/shopify/product/<id>?country=IN&Color=Green&Size=M → ProductView for that variant. */
export async function GET(req: Request, { params }: RouteContext<"/api/shopify/product/[id]">) {
  const { id } = await params;
  if (!isShortId(id)) return Response.json({ message: "Bad product id" }, { status: 400 });
  const sp = new URL(req.url).searchParams;
  const c = sp.get(COUNTRY_PARAM);
  const country = isCountryCode(c) ? getCountry(c) : null;
  const selected = [...sp.entries()]
    .filter(([k, v]) => k !== COUNTRY_PARAM && v)
    .slice(0, 10)
    .map(([name, label]) => ({ name: name.slice(0, 60), label: label.slice(0, 80) }));
  try {
    const p = await getProduct(id, selected, { country: country?.code, currency: country?.currency });
    if (!p) return Response.json({ message: "This product is no longer available." }, { status: 404 });
    return Response.json(toProductView(id, p));
  } catch (err) {
    console.error("[shopify] product failed:", err);
    const message = err instanceof ShopifyError ? err.message : "Couldn't load this product. Please try again.";
    return Response.json({ message }, { status: 502 });
  }
}
