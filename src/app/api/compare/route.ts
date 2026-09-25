import { z } from "zod";
import { compareProducts } from "@/lib/compare";
import { rateLimited, tooMany } from "@/lib/rateLimit";
import { jsonError, publicMessage } from "@/lib/sse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// LLM + search work can take 10–25s; give it room on Vercel.
export const maxDuration = 60;

const BodySchema = z.object({ ids: z.array(z.string()).min(2).max(3), query: z.string().max(500).optional(), criterion: z.string().max(200).optional() });

/** Side-by-side data + occasion matrix + text verdict. */
export async function POST(req: Request) {
  if (rateLimited(req)) return tooMany();
  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("Pick 2–3 products to compare.");
  try {
    return Response.json(await compareProducts(parsed.data));
  } catch (err) {
    if (err instanceof Error && /no longer available/.test(err.message)) return jsonError(err.message, 404);
    return jsonError(publicMessage(err), 502, true);
  }
}
