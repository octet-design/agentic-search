"use client";

import { AnimatePresence, motion } from "framer-motion";
import { PanelLeft, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useHydrated } from "@/hooks/useHydrated";
import { ChatSidebar } from "./ChatSidebar";

/** Sidebar (desktop) / slide-over (mobile) + main column, filling the viewport under the header. */
export function ChatLayout({ activeId, title, children }: { activeId?: string; title?: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const hydrated = useHydrated();
  return (
    <div className="flex h-[calc(100dvh-3.5rem)]">
      <aside className="hidden w-72 shrink-0 border-r border-line bg-canvas md:block">
        <ChatSidebar activeId={activeId} />
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
                    <ChatSidebar activeId={activeId} onNavigate={() => setOpen(false)} />
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
