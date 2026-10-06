import { z } from "zod";
import { retrieveAnchor, retrieveRails } from "@/lib/agent/retrieve";
import { getTaxonomy } from "@/lib/agent/taxonomy";
import { IntentSchema } from "@/lib/agent/types";
import { shopifyForSection } from "@/lib/blendServer";
import { rateLimited, tooMany } from "@/lib/rateLimit";
import { rankBlend } from "@/lib/relevance";
import { jsonError, publicMessage } from "@/lib/sse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  intent: IntentSchema,
  anchor: z.object({ terms: z.array(z.string()).max(8), categoryLevel: z.boolean() }).nullable().optional(),
  categories: z.array(z.string()).max(10).default([]),
});

/**
 * Scout's longer list for a result set: our catalog (same filters as the chat, plus titles naming the
 * item in any category) and Shopify, exact matches only, on one relevance scale with catalog first on ties.
 */
export async function POST(req: Request) {
  if (rateLimited(req, 60)) return tooMany();
  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("Invalid request.");
  const { intent, anchor, categories } = parsed.data;
  const tax = getTaxonomy();
  try {
    const [[rail], fromTitles, shopify] = await Promise.all([
      retrieveRails([{ id: "all", intent, perPage: 100 }], tax, { strict: true }),
      anchor ? retrieveAnchor(intent, anchor.terms, tax, 60) : Promise.resolve([]),
      shopifyForSection({ query: anchor?.terms[0] ?? intent.semanticQuery, audience: intent.audience, min: intent.price?.min, max: intent.price?.max, limit: 40 }),
    ]);
    const res = await rankBlend({
      catalog: [...fromTitles, ...rail.products],
      shopify,
      query: anchor?.terms[0] ? `${anchor.terms[0]} ${intent.semanticQuery}` : intent.semanticQuery,
      anchor: anchor ?? null,
      sectionCategories: categories,
      tax,
      limit: 120,
      perBrand: 4,
    });
    return Response.json(res);
  } catch (err) {
    return jsonError(publicMessage(err), 502, true);
  }
}
