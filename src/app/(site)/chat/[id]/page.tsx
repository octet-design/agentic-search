import { ChatView } from "@/components/chat/ChatView";

export default async function ChatPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  return <ChatView key={id} id={id} debug={sp.debug === "1"} />;
}
