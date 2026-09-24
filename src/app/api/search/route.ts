import { z } from "zod";
import { TastePayloadSchema } from "@/lib/agent/personalize";
import { runSearch } from "@/lib/agent/pipeline";
import { IntentPatchSchema, IntentSchema } from "@/lib/agent/types";
import { rateLimited, tooMany } from "@/lib/rateLimit";
import { jsonError, sseResponse } from "@/lib/sse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// LLM + search work can take 10–25s; give it room on Vercel.
export const maxDuration = 60;

const BodySchema = z.object({
  query: z.string().trim().min(1).max(500),
  intent: IntentSchema.optional(),
  overrides: IntentPatchSchema.optional(),
  taste: TastePayloadSchema.optional(),
  debug: z.boolean().optional(),
  strict: z.boolean().optional(),
  noPlan: z.boolean().optional(),
});

export async function POST(req: Request) {
  if (rateLimited(req)) return tooMany();
  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("Invalid request.");
  const body = parsed.data;
  return sseResponse((emit, signal) => runSearch({ ...body, signal }, emit), req.signal);
}
