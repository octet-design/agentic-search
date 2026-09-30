import type { Metadata } from "next";
import { FindsHome } from "@/components/shopify/finds/FindsHome";
import { AGENT_NAME, AGENT_TAGLINE } from "@/lib/shopify/config";

export const metadata: Metadata = { title: AGENT_NAME, description: AGENT_TAGLINE };

/** Genuine Finds: conversational search over Shopify's Global Catalog. Separate from Drape. */
export default function FindsPage() {
  return <FindsHome />;
}
