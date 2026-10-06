import { z } from "zod";
import { retrieveAnchor, retrieveRails } from "@/lib/agent/retrieve";
import { getTaxonomy } from "@/lib/agent/taxonomy";
import { IntentSchema } from "@/lib/agent/types";
import { shopifyForSection } from "@/lib/blendServer";
import { rateLimited, tooMany } from "@/lib/rateLimit";
import { noExactNote, rankBlend } from "@/lib/relevance";
import { jsonError, publicMessage } from "@/lib/sse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Upper bound on the list (ours ≤ ~250 after dedupe + Shopify ≤ 40), just as a safety net. */
const MAX_LIST = 400;

const BodySchema = z.object({
  intent: IntentSchema,
  anchor: z.object({ terms: z.array(z.string()).max(8), categoryLevel: z.boolean() }).nullable().optional(),
  categories: z.array(z.string()).max(40).default([]),
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
      // Every exact match: all of ours first, then all of Shopify's (a total cap would cut Shopify off
      // whenever our catalog has many matches, e.g. 182 linen kurtas).
      limit: MAX_LIST,
      perBrand: 4,
    });
    // Scout's segment pills show this when a tapped segment has no exact match.
    return Response.json({ ...res, emptyNote: anchor && !res.products.length ? noExactNote(anchor) : undefined });
  } catch (err) {
    return jsonError(publicMessage(err), 502, true);
  }
}
