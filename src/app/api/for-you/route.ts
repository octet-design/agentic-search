import { z } from "zod";
import { getEmbeddings, gendersLike, meanVector, vectorNeighbours } from "@/lib/similar";
import { jsonError, publicMessage } from "@/lib/sse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// LLM + search work can take 10–25s; give it room on Vercel.
export const maxDuration = 60;

const BodySchema = z.object({
  likedIds: z.array(z.string()).min(1).max(10),
  excludeIds: z.array(z.string()).max(200).default([]),
  audience: z.array(z.string()).optional(),
  k: z.number().int().min(1).max(36).default(18),
});

/** Mean of the last ≤ 10 liked embeddings → vector search, excluding liked/disliked (brief §8.3). */
export async function POST(req: Request) {
  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("Invalid request.");
  const { likedIds, excludeIds, audience, k } = parsed.data;
  try {
    const embs = [...(await getEmbeddings(likedIds)).values()];
    if (!embs.length) return Response.json({ products: [] });
    const genders = audience?.length ? audience : [...new Set(embs.flatMap((e) => gendersLike(e.doc.gender)))];
    const products = await vectorNeighbours({
      vector: meanVector(embs.map((e) => e.vec)),
      genders,
      excludeIds: [...likedIds, ...excludeIds],
      k,
    });
    return Response.json({ products: products.map((p) => ({ ...p, reason: "Close to things you saved" })) });
  } catch (err) {
    return jsonError(publicMessage(err), 502, true);
  }
}
