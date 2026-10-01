import type { Metadata } from "next";
import { AuraHome, type Example } from "@/components/shopify/aura/AuraHome";
import { AGENT_NAME, AGENT_TAGLINE } from "@/lib/shopify/config";
import { getCountry } from "@/lib/shopify/countries";
import { getShopifyEnv } from "@/lib/shopify/env";
import { searchFashion } from "@/lib/shopify/search";

export const metadata: Metadata = { title: AGENT_NAME, description: AGENT_TAGLINE };

/** Example searches: the full prompt shown, and a short query that finds a photo for its card. */
const EXAMPLES = [
  { query: "Pastel kurta set with mirror work, size M", photo: "pastel kurta set women" },
  { query: "Versatile midi summer dress, fitted waist, no patterns", photo: "midi summer dress" },
  { query: "Linen co-ord set for a beach holiday, under ₹4,000", photo: "linen co-ord set women" },
  { query: "Blazer with a cinched waist in neutral colours", photo: "belted blazer women" },
];

// One product photo per example, refreshed hourly (the first result for its short query).
let cached: { at: number; examples: Example[] } | null = null;
async function examples(): Promise<Example[]> {
  if (cached && Date.now() - cached.at < 60 * 60_000) return cached.examples;
  const country = getCountry(getShopifyEnv().SHOPIFY_COUNTRY);
  const out = await Promise.all(
    EXAMPLES.map(async (e) => {
      const page = await searchFashion({ query: e.photo, min: null, max: null, local: false }, country, { limit: 3 }).catch(() => null);
      return { query: e.query, image: page?.products.find((p) => p.image)?.image ?? null };
    }),
  );
  if (out.some((e) => e.image)) cached = { at: Date.now(), examples: out };
  return out;
}

/** Aura: Plush-style AI fashion discovery on Shopify's Global Catalog. Separate from Drape. */
export default async function AuraPage() {
  return <AuraHome examples={await examples()} />;
}
