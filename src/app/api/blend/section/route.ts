import { z } from "zod";
import { retrieveAnchor, retrieveRails } from "@/lib/agent/retrieve";
import { getTaxonomy } from "@/lib/agent/taxonomy";
import { anchorQueries, shopifyQuery } from "@/lib/agent/chatAgent";
import { IntentSchema } from "@/lib/agent/types";
import { shopifyForSection } from "@/lib/blendServer";
import { rateLimited, tooMany } from "@/lib/rateLimit";
import { noExactNote, rankBlend, SCOUT_LIST, scoutLists } from "@/lib/relevance";
import { jsonError, publicMessage } from "@/lib/sse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  intent: IntentSchema,
  anchor: z
    .object({
      terms: z.array(z.string()).max(8),
      categoryLevel: z.boolean(),
      mustInclude: z.array(z.string()).max(4).optional(),
      store: z.string().max(80).optional(),
      forItem: z.string().max(40).optional(),
    })
    .nullable()
    .optional(),
  categories: z.array(z.string()).max(40).default([]),
  /** The result set's id: the list the chat ranked for it is reused as-is, so the grid keeps the same order. */
  id: z.string().max(80).optional(),
});

/**
 * Scout's longer list for a result set: our catalog (same filters as the chat, plus titles naming the
 * item in any category) and Shopify, exact matches only, on one relevance scale with catalog first on ties.
 */
export async function POST(req: Request) {
  if (rateLimited(req, 60)) return tooMany();
  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("Invalid request.");
  const { intent, anchor, categories, id } = parsed.data;
  const cached = id ? scoutLists.get(id) : undefined;
  if (cached) return Response.json({ ...cached, emptyNote: anchor && !cached.products.length ? noExactNote(anchor) : undefined });
  const tax = getTaxonomy();
  try {
    const [[rail], fromTitles, shopify] = await Promise.all([
      retrieveRails([{ id: "all", intent, perPage: SCOUT_LIST.catalogPerPage }], tax, { strict: true }),
      anchor ? retrieveAnchor(intent, anchorQueries(anchor), tax, SCOUT_LIST.anchorPerPage) : Promise.resolve([]),
      shopifyForSection({
        query: anchor ? shopifyQuery(anchor, intent.semanticQuery) : intent.semanticQuery,
        audience: intent.audience,
        min: intent.price?.min,
        max: intent.price?.max,
        limit: SCOUT_LIST.shopifyLimit,
      }),
    ]);
    const res = await rankBlend({
      // Our catalog is fashion-only: no fashion category means partner stores only.
      catalog: categories.length ? [...fromTitles, ...rail.products] : [],
      shopify,
      // The same query the chat ranks with, so a recomputed list matches the chat's order.
      query: intent.semanticQuery,
      anchor: anchor ?? null,
      sectionCategories: categories,
      tax,
      // Every exact match, ranked by relevance across both sources.
      limit: SCOUT_LIST.limit,
      perBrand: SCOUT_LIST.perBrand,
      sort: intent.sort,
    });
    if (id) scoutLists.set(id, res);
    // Scout's segment pills show this when a tapped segment has no exact match.
    return Response.json({ ...res, emptyNote: anchor && !res.products.length ? noExactNote(anchor) : undefined });
  } catch (err) {
    return jsonError(publicMessage(err), 502, true);
  }
}
