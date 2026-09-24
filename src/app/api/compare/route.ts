import { z } from "zod";
import { getEnv } from "@/lib/env";
import { cleanText } from "@/lib/agent/cleanText";
import { toCard } from "@/lib/agent/retrieve";
import { getTaxonomy } from "@/lib/agent/taxonomy";
import { llmStructured } from "@/lib/llm";
import { getRawProducts } from "@/lib/products";
import { rateLimited, tooMany } from "@/lib/rateLimit";
import { jsonError, publicMessage } from "@/lib/sse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// LLM + search work can take 10–25s; give it room on Vercel.
export const maxDuration = 60;

const BodySchema = z.object({ ids: z.array(z.string()).min(2).max(3), query: z.string().max(500).optional(), criterion: z.string().max(200).optional() });
const VerdictSchema = z.object({ bullets: z.array(z.string()) });

/** Side-by-side data + an LLM verdict grounded only in product data (brief §9.6). */
export async function POST(req: Request) {
  if (rateLimited(req)) return tooMany();
  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("Pick 2–3 products to compare.");
  const { ids, query, criterion } = parsed.data;
  try {
    const raw = await getRawProducts(ids);
    const byId = new Map(raw.map((r) => [r.id, r]));
    const ordered = ids.map((id) => byId.get(id)).filter((r): r is NonNullable<typeof r> => !!r);
    const tax = getTaxonomy();
    const products = ordered.map((r) => toCard(r, 0, tax));
    if (products.length < 2) return jsonError("Some of these products are no longer available.", 404);
    const letters = ["A", "B", "C"];
    const verdict = await llmStructured({
      name: "compare",
      model: getEnv().OPENAI_MODEL_FAST,
      schema: VerdictSchema,
      system:
        'Compare 2–3 fashion products for an Indian shopper. Return 2–3 bullets in the form "Pick A if …" / "Pick B if …", grounded ONLY in the given data (fabric, fit, pattern, colour, price, occasions, brand). No invented facts about quality, stock, delivery or reviews. Mention prices as ₹1,999.',
      user: `${query ? `Shopper's original request: ${query}\n` : ""}${criterion ? `They care about: ${criterion}\n` : ""}${ordered
        .map((r, i) => `${letters[i]}: ${cleanText(r.title)} | ${r.brand} | ₹${Math.round(r.price)} | colour ${r.color} | fabric ${r.fabric ?? "?"} | fit ${r.fit ?? "?"} | pattern ${r.pattern ?? "?"} | occasions ${(r.use_case ?? []).join(", ")} | ${cleanText(r.description).slice(0, 160)}`)
        .join("\n")}`,
      timeoutMs: 15_000,
    });
    return Response.json({ products, verdict: verdict.bullets.slice(0, 3) });
  } catch (err) {
    return jsonError(publicMessage(err), 502, true);
  }
}
