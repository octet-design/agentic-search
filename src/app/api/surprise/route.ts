import { z } from "zod";
import { getEnv } from "@/lib/env";
import { TastePayloadSchema } from "@/lib/agent/personalize";
import { llmStructured } from "@/lib/llm";
import { editHref } from "@/lib/format";
import { rateLimited, tooMany } from "@/lib/rateLimit";
import { jsonError, publicMessage } from "@/lib/sse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({ taste: TastePayloadSchema.optional(), recent: z.array(z.string()).max(20).optional() });
const EditsSchema = z.object({ edits: z.array(z.object({ title: z.string(), query: z.string() })) });

/** 3 fresh seasonal/festival edits from taste + today's date; pick one at random (brief §9.7). */
export async function POST(req: Request) {
  if (rateLimited(req)) return tooMany();
  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("Invalid request.");
  const { taste, recent } = parsed.data;
  const audiences = taste?.audiences?.length ? taste.audiences : ["women", "men", "girls", "boys"];
  const audience = audiences[Math.floor(Math.random() * audiences.length)];
  try {
    const res = await llmStructured({
      name: "surprise",
      model: getEnv().OPENAI_MODEL_FAST,
      schema: EditsSchema,
      system:
        "You curate surprising but useful fashion edits for Indian shoppers. You know the Indian seasons and the festival calendar; use today's date to pick what's timely (upcoming festivals, weddings, monsoon, winter, summer, travel). Propose exactly 3 edits. title: catchy, 3–6 words (e.g. \"Monsoon-ready kolhapuris\"). query: what the shopper would type, specific, naming the audience (e.g. \"waterproof kolhapuri sandals for women for the monsoon\").",
      user: `Today: ${new Date().toISOString().slice(0, 10)}\nAudience: ${audience}\n${taste?.summary ? `Taste: ${taste.summary}` : "No taste yet: pick a timely seasonal or festival edit."}\nAlready searched (avoid): ${(recent ?? []).join("; ") || "none"}`,
      temperature: 0.9,
    });
    const pick = res.edits[Math.floor(Math.random() * res.edits.length)];
    if (!pick) return jsonError("No idea right now. Try again!", 502, true);
    return Response.json({ title: pick.title, query: pick.query, slug: editHref(pick.query) });
  } catch (err) {
    return jsonError(publicMessage(err), 502, true);
  }
}
