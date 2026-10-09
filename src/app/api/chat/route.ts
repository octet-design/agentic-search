import { z } from "zod";
import { MEMORY_KINDS } from "@/lib/memory";
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
  refs: z.array(z.number().int()).max(5).default([]),
  /** A photo attached to the message (resized client-side). Always sent with text: `message` is required. */
  image: z
    .string()
    .max(2_000_000)
    .regex(/^data:image\/(jpeg|png|webp);base64,/)
    .optional(),
  /** The "Shopping for" picker choice for this chat. */
  audience: z.enum(["women", "men", "girls", "boys"]).nullable().default(null),
  memory: z.array(z.string().max(200)).max(30).default([]),
  /** Scout memory by person (null = off). */
  people: z
    .array(
      z.object({
        key: z.string().max(80),
        label: z.string().max(60),
        facts: z
          .array(
            z.object({
              id: z.string().max(40),
              kind: z.enum(MEMORY_KINDS),
              text: z.string().max(160),
              at: z.number(),
              source: z.enum(["stated", "inferred"]).optional(),
              seen: z.number().optional(),
            }),
          )
          .max(15),
      }),
    )
    .max(12)
    .nullable()
    .default(null),
  taste: TastePayloadSchema.optional(),
  debug: z.boolean().optional(),
  /** "aura" for Aura++ (short Plush-style replies). */
  style: z.enum(["drape", "aura"]).optional(),
  /** Scout: mix Shopify results into every result set. */
  blend: z.boolean().optional(),
});

export async function POST(req: Request) {
  if (rateLimited(req)) return tooMany();
  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("Invalid request.");
  return sseResponse((emit, signal) => runChatTurn({ ...parsed.data, signal }, emit), req.signal);
}
