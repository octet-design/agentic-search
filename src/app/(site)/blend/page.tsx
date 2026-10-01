import type { Metadata } from "next";
import { BLEND_MODE } from "@/components/aura-plus/mode";
import { PlusHome } from "@/components/aura-plus/PlusHome";
import { getExamples } from "@/lib/examples";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Blend search", description: "Our catalog and stores across Shopify in one conversation, each product tagged with its source." };

/** Blend search: Typesense search's flow with Shopify Global Catalog results mixed in, tagged by source. */
export default async function BlendPage() {
  return <PlusHome examples={await getExamples()} mode={BLEND_MODE} />;
}
