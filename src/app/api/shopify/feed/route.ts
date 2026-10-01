import { z } from "zod";
import { getCountry, isCountryCode } from "@/lib/shopify/countries";
import { feedPage } from "@/lib/shopify/feed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Id = z.string().regex(/^[\w-]{1,64}$/);
const BodySchema = z.object({
  country: z.string().refine(isCountryCode),
  seeds: z
    .object({
      products: z.array(z.object({ id: Id, title: z.string().max(300) })).max(3).default([]),
      queries: z.array(z.string().trim().min(1).max(120)).max(3).default([]),
      brands: z.array(z.object({ id: z.string().regex(/^gid:\/\/shopify\/Shop\/\d+$/), name: z.string().max(120) })).max(2).default([]),
    })
    .default({ products: [], queries: [], brands: [] }),
  cursor: z.string().max(8000).nullish(),
  exclude: z.array(Id).max(300).default([]),
});

/** POST { country, seeds, cursor?, exclude? } → a page of the personalised "For you" feed. */
export async function POST(req: Request) {
  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ message: "Invalid request." }, { status: 400 });
  try {
    return Response.json(await feedPage({ ...parsed.data, country: getCountry(parsed.data.country), signal: req.signal }));
  } catch (err) {
    console.error("[aura] feed failed:", err);
    return Response.json({ message: "Couldn't load your feed." }, { status: 502 });
  }
}
