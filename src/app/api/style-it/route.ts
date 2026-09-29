import { z } from "zod";
import { rateLimited, tooMany } from "@/lib/rateLimit";
import { jsonError, publicMessage } from "@/lib/sse";
import { styleIt } from "@/lib/styleIt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// One LLM plan (cached per product) + a few searches.
export const maxDuration = 60;

const BodySchema = z.object({ id: z.string().min(1).max(80), occasion: z.string().max(60).optional() });

export async function POST(req: Request) {
  if (rateLimited(req)) return tooMany();
  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("Invalid request.");
  try {
    const res = await styleIt(parsed.data);
    if (!res) return jsonError("Couldn't style this piece.", 404);
    return Response.json(res);
  } catch (err) {
    return jsonError(publicMessage(err), 502, true);
  }
}
