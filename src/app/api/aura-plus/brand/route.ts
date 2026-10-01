import { moreFromBrand } from "@/lib/auraPlus";
import { jsonError, publicMessage } from "@/lib/sse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET ?id=<product id> → other in-stock products from the same brand. */
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id") ?? "";
  if (!/^[\w-]{1,80}$/.test(id)) return jsonError("Pass ?id=");
  try {
    return Response.json(await moreFromBrand(id));
  } catch (err) {
    return jsonError(publicMessage(err), 502, true);
  }
}
