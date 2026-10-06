import type { Metadata } from "next";
import { SCOUT_MODE } from "@/components/aura-plus/mode";
import { PlusSearch } from "@/components/aura-plus/PlusSearch";

export const metadata: Metadata = { title: "Scout" };

export default async function ScoutChatPage({ params }: PageProps<"/scout/c/[id]">) {
  const { id } = await params;
  return <PlusSearch key={id} id={id} mode={SCOUT_MODE} />;
}
