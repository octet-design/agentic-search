import { z } from "zod";
import { ChatStateSchema, runChatTurn } from "@/lib/agent/chatAgent";
import { TastePayloadSchema } from "@/lib/agent/personalize";
import { rateLimited, tooMany } from "@/lib/rateLimit";
import { jsonError, sseResponse } from "@/lib/sse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// A chat turn streams planning, search and the write-up (10–25s).
export const maxDuration = 60;

const BodySchema = z.object({
  message: z.string().trim().min(1).max(1000),
  history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(4000) })).max(20),
  state: ChatStateSchema,
  memory: z.array(z.string().max(200)).max(30).default([]),
  taste: TastePayloadSchema.optional(),
  debug: z.boolean().optional(),
});

export async function POST(req: Request) {
  if (rateLimited(req)) return tooMany();
  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("Invalid request.");
  return sseResponse((emit, signal) => runChatTurn({ ...parsed.data, signal }, emit), req.signal);
}
