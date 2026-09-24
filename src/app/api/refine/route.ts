import { z } from "zod";
import { TastePayloadSchema } from "@/lib/agent/personalize";
import { runRefine } from "@/lib/agent/refineAgent";
import { IntentSchema } from "@/lib/agent/types";
import { rateLimited, tooMany } from "@/lib/rateLimit";
import { jsonError, sseResponse } from "@/lib/sse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// LLM + search work can take 10–25s; give it room on Vercel.
export const maxDuration = 60;

const BodySchema = z.object({
  query: z.string().trim().min(1).max(500),
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(2000) })).min(1).max(40),
  intent: IntentSchema,
  visible: z
    .array(z.object({ n: z.number().int(), id: z.string(), title: z.string(), brand: z.string(), color: z.string(), price: z.number() }))
    .max(12),
  taste: TastePayloadSchema.optional(),
});

export async function POST(req: Request) {
  if (rateLimited(req)) return tooMany();
  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("Invalid request.");
  return sseResponse((emit, signal) => runRefine({ ...parsed.data, signal }, emit), req.signal);
}
