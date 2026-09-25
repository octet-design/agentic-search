"use client";

import { Heart, MessageSquare, Plus, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useHydrated } from "@/hooks/useHydrated";
import { cn } from "@/lib/format";
import { useChats } from "@/store/chats";

function ago(ts: number) {
  const m = Math.round((Date.now() - ts) / 60_000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h}h` : `${Math.round(h / 24)}d`;
}

/** New chat + chat history (this browser) + shortcuts. */
export function ChatSidebar({ activeId, onNavigate }: { activeId?: string; onNavigate?: () => void }) {
  const hydrated = useHydrated();
  const order = useChats((s) => s.order);
  const chats = useChats((s) => s.chats);
  const deleteChat = useChats((s) => s.deleteChat);
  const list = hydrated ? order.map((id) => chats[id]).filter((c) => c && c.messages.length > 0) : [];

  return (
    <nav className="flex h-full flex-col gap-1 p-3 text-sm" aria-label="Chats">
      <Link href="/" onClick={onNavigate} className="mb-2 inline-flex items-center justify-center gap-2 rounded-full bg-ink px-4 py-2.5 font-medium text-canvas hover:bg-ink/90">
        <Plus size={16} /> New chat
      </Link>
      <div className="px-2 pb-1 pt-2 text-xs uppercase tracking-wide text-ink-faint">Your chats</div>
      <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto">
        {list.length === 0 && <p className="px-2 py-1 text-ink-faint">No chats yet.</p>}
        {list.map((c) => (
          <div key={c.id} className={cn("group flex items-center gap-2 rounded-lg px-2 py-2", c.id === activeId ? "bg-sand" : "hover:bg-sand/60")}>
            <MessageSquare size={14} className="shrink-0 text-ink-faint" />
            <Link href={`/chat/${c.id}`} onClick={onNavigate} className="min-w-0 flex-1 truncate">
              {c.title}
            </Link>
            <span className="text-xs text-ink-faint group-hover:hidden">{ago(c.updatedAt)}</span>
            <button
              onClick={() => deleteChat(c.id)}
              className="hidden rounded p-0.5 text-ink-faint hover:text-warn group-hover:block"
              aria-label={`Delete chat ${c.title}`}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
      <div className="mt-2 space-y-0.5 border-t border-line pt-2">
        <Link href="/saved" onClick={onNavigate} className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-sand/60">
          <Heart size={14} /> Saved & For you
        </Link>
        <Link href="/search" onClick={onNavigate} className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-sand/60">
          <Search size={14} /> Classic search
        </Link>
      </div>
    </nav>
  );
}
