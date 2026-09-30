import type { Metadata } from "next";
import { FindsChat } from "@/components/shopify/finds/FindsChat";
import { AGENT_NAME } from "@/lib/shopify/config";

export const metadata: Metadata = { title: AGENT_NAME };

export default async function FindsChatPage({ params }: PageProps<"/finds/[id]">) {
  const { id } = await params;
  return <FindsChat key={id} id={id} />;
}
