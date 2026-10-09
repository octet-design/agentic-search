import type { Metadata } from "next";
import { SCOUT_MODE } from "@/components/aura-plus/mode";
import { PlusHome } from "@/components/aura-plus/PlusHome";
import { scoutExamples } from "@/lib/blendServer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Scout", description: "A shopping agent that scouts our catalog and stores on Shopify that deliver to India, asks what you need, and shows only exact matches." };

/** Scout (formerly Blend search): Typesense search's flow with Shopify Global Catalog results mixed in, tagged by source. */
export default async function ScoutPage() {
  return <PlusHome examples={await scoutExamples()} mode={SCOUT_MODE} />;
}
