import { z } from "zod";
import { feedPage } from "@/lib/auraPlus";
import { jsonError, publicMessage } from "@/lib/sse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Id = z.string().min(1).max(80);
const BodySchema = z.object({
  /** Saved product ids (newest last): the personal half of the feed. */
  seedIds: z.array(Id).max(10).default([]),
  excludeIds: z.array(Id).max(300).default([]),
  cursor: z.string().max(2000).nullish(),
});

/** POST → a page of Aura++'s Pinterest-style feed from the Typesense catalog. */
export async function POST(req: Request) {
  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("Invalid request.");
  try {
    return Response.json(await feedPage(parsed.data));
  } catch (err) {
    return jsonError(publicMessage(err), 502, true);
  }
}
