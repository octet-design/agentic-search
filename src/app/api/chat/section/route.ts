import { z } from "zod";
import { retrieveRails, diversify } from "@/lib/agent/retrieve";
import { sortByPrice } from "@/lib/relevance";
import { getTaxonomy } from "@/lib/agent/taxonomy";
import { IntentSchema } from "@/lib/agent/types";
import { rateLimited, tooMany } from "@/lib/rateLimit";
import { jsonError, publicMessage } from "@/lib/sse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({ intent: IntentSchema });

/**
 * "See all" for a chat section: the same filters the chat used (after any relaxation), a bigger page,
 * no LLM calls and no taste. The client pages through the list.
 */
export async function POST(req: Request) {
  if (rateLimited(req, 60)) return tooMany();
  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("Invalid request.");
  try {
    const [rail] = await retrieveRails([{ id: "all", intent: parsed.data.intent, perPage: 100 }], getTaxonomy(), { strict: true });
    return Response.json({ products: sortByPrice(diversify(rail.products, 48, 4), parsed.data.intent.sort), found: rail.found });
  } catch (err) {
    return jsonError(publicMessage(err), 502, true);
  }
}
