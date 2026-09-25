"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ProductImage } from "@/components/product/ProductImage";
import { useHydrated } from "@/hooks/useHydrated";
import { useSession } from "@/store/session";

/** Sticky tray while items are selected for compare (brief §9.6). */
export function CompareTray() {
  const ids = useSession((s) => s.compare);
  const cards = useSession((s) => s.cards);
  const { toggleCompare, clearCompare } = useSession.getState();
  const pathname = usePathname();
  const mounted = useHydrated();
  const show = mounted && ids.length > 0 && pathname !== "/compare";
  // Chat pages have a composer at the bottom; sit above it.
  const inChat = pathname === "/" || pathname.startsWith("/chat/");

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 80 }}
          animate={{ y: 0 }}
          exit={{ y: 80 }}
          className={`fixed ${inChat ? "bottom-36" : "bottom-4"} left-1/2 z-30 flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-line bg-paper p-2 pr-3 shadow-xl`}
        >
          {ids.map((id) => (
            <div key={id} className="relative">
              <ProductImage src={cards[id]?.image ?? null} alt={cards[id]?.title ?? "Product"} className="h-14 w-11 rounded-lg" />
              <button
                onClick={() => cards[id] && toggleCompare(cards[id])}
                className="absolute -right-1.5 -top-1.5 rounded-full bg-ink p-0.5 text-canvas"
                aria-label="Remove from compare"
              >
                <X size={11} />
              </button>
            </div>
          ))}
          <div className="flex flex-col gap-1">
            <Link
              href={`/compare?ids=${ids.join(",")}`}
              aria-disabled={ids.length < 2}
              onClick={(e) => {
                // In a chat, compare inside the conversation (the chat view handles it if the items have #refs there).
                const ev = new CustomEvent("drape:compare", { detail: ids, cancelable: true });
                if (!window.dispatchEvent(ev)) e.preventDefault();
              }}
              className={ids.length < 2 ? "pointer-events-none rounded-full bg-ink/30 px-4 py-1.5 text-sm text-canvas" : "rounded-full bg-ink px-4 py-1.5 text-sm text-canvas"}
            >
              Compare {ids.length}/3
            </Link>
            <button onClick={clearCompare} className="text-xs text-ink-soft hover:text-ink">
              Clear
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
