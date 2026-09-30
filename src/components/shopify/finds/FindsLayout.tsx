"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Heart, MessageSquare, PanelLeft, Plus, Search, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useFinds } from "@/lib/shopify/chat/store";
import { getCountry } from "@/lib/shopify/countries";
import { useHydrated } from "./ui";

function ago(ts: number) {
  const m = Math.round((Date.now() - ts) / 60_000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h}h` : `${Math.round(h / 24)}d`;
}

function Sidebar({ activeId, onNavigate }: { activeId?: string; onNavigate?: () => void }) {
  const hydrated = useHydrated();
  const order = useFinds((s) => s.order);
  const chats = useFinds((s) => s.chats);
  const deleteChat = useFinds((s) => s.deleteChat);
  const savedCount = useFinds((s) => s.saved.length);
  const list = hydrated ? order.map((id) => chats[id]).filter((c) => c && c.messages.length > 0) : [];

  return (
    <nav className="flex h-full flex-col gap-1 p-3 text-sm" aria-label="Chats">
      <Link href="/finds" onClick={onNavigate} className="mb-2 inline-flex items-center justify-center gap-2 rounded-full bg-ink px-4 py-2.5 font-medium text-canvas hover:bg-ink/90">
        <Plus size={16} /> New chat
      </Link>
      <div className="px-2 pb-1 pt-2 text-xs uppercase tracking-wide text-ink-faint">Your chats</div>
      <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto">
        {list.length === 0 && <p className="px-2 py-1 text-ink-faint">No chats yet.</p>}
        {list.map((c) => (
          <div key={c.id} className={`group flex items-center gap-2 rounded-lg px-2 py-2 ${c.id === activeId ? "bg-sand" : "hover:bg-sand/60"}`}>
            <MessageSquare size={14} className="shrink-0 text-ink-faint" />
            <Link href={`/finds/${c.id}`} onClick={onNavigate} className="min-w-0 flex-1 truncate">
              {c.title}
            </Link>
            <span className="text-xs text-ink-faint group-hover:hidden" title={getCountry(c.country).name}>
              {getCountry(c.country).flag} {ago(c.updatedAt)}
            </span>
            <button onClick={() => deleteChat(c.id)} className="hidden rounded p-0.5 text-ink-faint hover:text-warn group-hover:block" aria-label={`Delete chat ${c.title}`}>
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
      <div className="mt-2 space-y-0.5 border-t border-line pt-2">
        <Link href="/finds/saved" onClick={onNavigate} className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-sand/60">
          <Heart size={14} /> Saved
          {hydrated && savedCount > 0 && <span className="ml-auto rounded-full bg-accent px-1.5 text-xs text-white">{savedCount}</span>}
        </Link>
        <Link href="/shopify" onClick={onNavigate} className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-sand/60">
          <Search size={14} /> Browse without chat
        </Link>
      </div>
    </nav>
  );
}

/** Sidebar (desktop) / slide-over (mobile) + main column under the header. */
export function FindsLayout({ activeId, title, children }: { activeId?: string; title?: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const hydrated = useHydrated();
  return (
    <div className="flex h-[calc(100dvh-3.5rem)]">
      <aside className="hidden w-72 shrink-0 border-r border-line bg-canvas md:block">
        <Sidebar activeId={activeId} />
      </aside>
      <div className="relative flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2 border-b border-line px-3 py-2 md:hidden">
          <button onClick={() => setOpen(true)} className="rounded-full border border-line bg-paper p-2" aria-label="Open chats">
            <PanelLeft size={16} />
          </button>
          <span className="min-w-0 truncate text-sm text-ink-soft">{title ?? "New chat"}</span>
        </div>
        {children}
      </div>
      {hydrated &&
        createPortal(
          <AnimatePresence>
            {open && (
              <>
                <motion.div className="fixed inset-0 z-40 bg-ink/30 md:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
                <motion.aside
                  className="fixed inset-y-0 left-0 z-50 w-72 bg-canvas shadow-2xl md:hidden"
                  initial={{ x: "-100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "-100%" }}
                  transition={{ type: "spring", damping: 30, stiffness: 300 }}
                >
                  <button onClick={() => setOpen(false)} className="absolute right-3 top-3 rounded-full p-1.5 hover:bg-sand" aria-label="Close chats">
                    <X size={16} />
                  </button>
                  <div className="h-full pt-10">
                    <Sidebar activeId={activeId} onNavigate={() => setOpen(false)} />
                  </div>
                </motion.aside>
              </>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
}
