import { z } from "zod";
import { getEnv } from "@/lib/env";
import { intentSystemPrompt, sanitizeIntent } from "@/lib/agent/intent";
import { TastePayloadSchema } from "@/lib/agent/personalize";
import { runSearch } from "@/lib/agent/pipeline";
import { getTaxonomy } from "@/lib/agent/taxonomy";
import { IntentSchema } from "@/lib/agent/types";
import { llmStructured, Usage } from "@/lib/llm";
import { rateLimited, tooMany } from "@/lib/rateLimit";
import { jsonError, sseResponse } from "@/lib/sse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// LLM + search work can take 10–25s; give it room on Vercel.
export const maxDuration = 60;

const BodySchema = z.object({
  imageBase64: z
    .string()
    .max(3_000_000)
    .regex(/^data:image\/(jpeg|png|webp);base64,/),
  text: z.string().max(300).optional(),
  taste: TastePayloadSchema.optional(),
  debug: z.boolean().optional(),
});

/** Image → vision LLM → Intent (kind "similar") → the standard pipeline (brief §9.5). No image vectors. */
export async function POST(req: Request) {
  if (rateLimited(req)) return tooMany();
  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("Please upload a JPEG, PNG or WebP image under ~2 MB.");
  const { imageBase64, text, taste, debug } = parsed.data;
  const tax = getTaxonomy();

  return sseResponse(async (emit, signal) => {
    emit({ type: "step", id: "understand", label: "Looking at your photo", status: "running" });
    const t0 = performance.now();
    const usage = new Usage();
    const raw = await llmStructured({
      name: "image-intent",
      model: getEnv().OPENAI_MODEL_VISION,
      schema: IntentSchema,
      system:
        intentSystemPrompt(tax) +
        "\n\nIMAGE MODE: the user sent a photo of a garment or outfit. Set kind \"similar\". Describe the main garment in semanticQuery richly (garment type, silhouette, colours, pattern, fabric look, neckline/sleeves/length, details) in 10–20 English words. Map what you can see to canonical ids with strength \"prefer\" (category \"must\"). Infer the audience from the garment if clear. If the user added text (e.g. \"but in blue\"), it overrides what the photo shows.",
      user: [
        { type: "text", text: `User text: ${text?.trim() || "(none)"}\nToday: ${new Date().toISOString().slice(0, 10)}` },
        { type: "image_url", image_url: { url: imageBase64, detail: "low" } },
      ],
      usage,
      signal,
      timeoutMs: 25_000,
    });
    const intent = sanitizeIntent({ ...raw, kind: "similar", needsClarification: null }, tax, text ?? "");
    emit({ type: "step", id: "understand", label: "Looking at your photo", status: "done", ms: Math.round(performance.now() - t0) });
    await runSearch({ query: text?.trim() || intent.semanticQuery, intent, taste, debug, signal }, emit);
  }, req.signal);
}
