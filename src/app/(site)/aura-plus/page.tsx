import type { Metadata } from "next";
import { PlusHome } from "@/components/aura-plus/PlusHome";
import { getExamples } from "@/lib/examples";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Typesense search", description: "Plush-style AI fashion discovery on our own catalog." };

/** Aura++: Aura's experience (feed, loader, chat + live results) on Drape's Typesense catalog and chat engine. */
export default async function AuraPlusPage() {
  return <PlusHome examples={await getExamples()} />;
}
