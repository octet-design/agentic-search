import type { Metadata } from "next";
import { TYPESENSE_MODE } from "@/components/aura-plus/mode";
import { PlusSearch } from "@/components/aura-plus/PlusSearch";

export const metadata: Metadata = { title: "Typesense search" };

export default async function AuraPlusChatPage({ params }: PageProps<"/aura-plus/c/[id]">) {
  const { id } = await params;
  return <PlusSearch key={id} id={id} mode={TYPESENSE_MODE} />;
}
