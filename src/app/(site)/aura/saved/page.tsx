import type { Metadata } from "next";
import { AuraSaved } from "@/components/shopify/aura/AuraSaved";
import { AGENT_NAME } from "@/lib/shopify/config";

export const metadata: Metadata = { title: `Saved · ${AGENT_NAME}` };

export default function AuraSavedPage() {
  return <AuraSaved />;
}
