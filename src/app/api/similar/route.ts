import { z } from "zod";
import { mergeIntent, sanitizeIntent } from "@/lib/agent/intent";
import { getTaxonomy } from "@/lib/agent/taxonomy";
import { IntentPatchSchema, emptyIntent } from "@/lib/agent/types";
import { gendersLike, getEmbeddings, vectorNeighbours } from "@/lib/similar";
import { jsonError, publicMessage } from "@/lib/sse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  id: z.string().min(1).max(80),
  changes: IntentPatchSchema.optional(),
  audience: z.array(z.string()).optional(),
  excludeIds: z.array(z.string()).max(200).optional(),
  k: z.number().int().min(1).max(48).optional(),
});

export async function POST(req: Request) {
  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("Invalid request.");
  const { id, changes, audience, excludeIds, k } = parsed.data;
  try {
    const emb = (await getEmbeddings([id])).get(id);
    if (!emb) return Response.json({ products: [], source: null });
    const intent = changes ? sanitizeIntent(mergeIntent(emptyIntent(""), changes), getTaxonomy()) : undefined;
    const products = await vectorNeighbours({
      vector: emb.vec,
      genders: audience?.length ? audience : gendersLike(emb.doc.gender),
      excludeIds: [id, ...(excludeIds ?? [])],
      k,
      intent,
    });
    return Response.json({ products, source: { id, title: emb.doc.title } });
  } catch (err) {
    return jsonError(publicMessage(err), 502, true);
  }
}
