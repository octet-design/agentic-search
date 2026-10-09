import { z } from "zod";
import { getCountry, isCountryCode } from "@/lib/shopify/countries";
import { getShopifyEnv } from "@/lib/shopify/env";
import { styleIt } from "@/lib/shopify/styleIt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// One LLM plan (cached per product) + a few searches.
export const maxDuration = 60;

const BodySchema = z.object({
  id: z.string().regex(/^[\w-]{1,64}$/),
  country: z.string().optional(),
  occasion: z.string().max(60).optional(),
  /** Scout: any product (non-fashion gets "goes well with"), every category. */
  general: z.boolean().optional(),
});

/** POST { id, country?, occasion? } → 3 occasions and a complete look for one of them. */
export async function POST(req: Request) {
  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ message: "Invalid request." }, { status: 400 });
  const { id, occasion, general } = parsed.data;
  const country = getCountry(isCountryCode(parsed.data.country) ? parsed.data.country : getShopifyEnv().SHOPIFY_COUNTRY);
  try {
    const res = await styleIt({ id, country, occasion, general, signal: req.signal });
    if (!res) return Response.json({ message: "Couldn't style this piece." }, { status: 404 });
    return Response.json(res);
  } catch (err) {
    if (req.signal.aborted) return new Response(null, { status: 499 });
    console.error("[shopify] style-it failed:", err);
    return Response.json({ message: "Couldn't style this piece right now." }, { status: 502 });
  }
}
