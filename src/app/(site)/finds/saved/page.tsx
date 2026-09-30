import type { Metadata } from "next";
import { FindsSaved } from "@/components/shopify/finds/FindsSaved";
import { AGENT_NAME } from "@/lib/shopify/config";

export const metadata: Metadata = { title: `Saved · ${AGENT_NAME}` };

export default function FindsSavedPage() {
  return <FindsSaved />;
}
