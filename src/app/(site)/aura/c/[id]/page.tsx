import type { Metadata } from "next";
import { AuraSearch } from "@/components/shopify/aura/AuraSearch";
import { AGENT_NAME } from "@/lib/shopify/config";

export const metadata: Metadata = { title: AGENT_NAME };

export default async function AuraChatPage({ params }: PageProps<"/aura/c/[id]">) {
  const { id } = await params;
  return <AuraSearch key={id} id={id} />;
}
