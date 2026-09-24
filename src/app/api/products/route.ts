import { getProducts } from "@/lib/products";
import { jsonError, publicMessage } from "@/lib/sse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// LLM + search work can take 10–25s; give it room on Vercel.
export const maxDuration = 60;

export async function GET(req: Request) {
  const ids = (new URL(req.url).searchParams.get("ids") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^[\w-]{1,80}$/.test(s));
  if (!ids.length) return jsonError("Pass ?ids=a,b,c");
  try {
    return Response.json({ products: await getProducts(ids) });
  } catch (err) {
    return jsonError(publicMessage(err), 502, true);
  }
}
