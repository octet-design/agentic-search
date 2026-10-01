import type { Metadata } from "next";
import { BLEND_MODE } from "@/components/aura-plus/mode";
import { PlusSearch } from "@/components/aura-plus/PlusSearch";

export const metadata: Metadata = { title: "Blend search" };

export default async function BlendChatPage({ params }: PageProps<"/blend/c/[id]">) {
  const { id } = await params;
  return <PlusSearch key={id} id={id} mode={BLEND_MODE} />;
}
