"use client";

import { motion } from "framer-motion";
import { Heart, Layers, Sparkles, ThumbsDown } from "lucide-react";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { ProductImage } from "@/components/product/ProductImage";
import type { ProductCard } from "@/lib/agent/types";
import { inr } from "@/lib/format";
import { tileShape } from "@/lib/shopify/aura/ux";
import { useSession, type DislikeReason } from "@/store/session";

/** What a tile can do on the current screen; missing actions are not shown. */
export type PlusActions = {
  onOpen: (p: ProductCard) => void;
  /** ✦ Ask about this product (a quick question, or null to start typing about it). */
  onAsk?: (p: ProductCard, question: string | null) => void;
  onMoreLike?: (p: ProductCard) => void;
  /** Scout: show where each product comes from. */
  showSource?: boolean;
};
export const PlusActionsContext = createContext<PlusActions | null>(null);
const useActions = () => {
  const a = useContext(PlusActionsContext);
  if (!a) throw new Error("PlusActionsContext missing");
  return a;
};

const QUICK_ASKS = ["Is it true to size?", "What goes with it?", "Cheaper alternatives?"];
const DISLIKE: { id: DislikeReason; label: string }[] = [
  { id: "price", label: "Too pricey" },
  { id: "style", label: "Not my style" },
  { id: "color", label: "Colour" },
  { id: "fabric", label: "Fabric" },
  { id: "other", label: "Other" },
];

function Menu({ open, onClose, className, children }: { open: boolean; onClose: () => void; className: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && onClose();
    window.addEventListener("mousedown", away);
    return () => window.removeEventListener("mousedown", away);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div ref={ref} role="menu" className={`absolute z-20 w-52 rounded-xl border border-line bg-paper p-1 text-left shadow-lg ${className}`}>
      {children}
    </div>
  );
}
const Item = ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => (
  <button role="menuitem" onClick={onClick} className="block w-full rounded-lg px-2.5 py-1.5 text-left text-sm hover:bg-sand">
    {children}
  </button>
);

/** Drape catalog product as an Aura tile: 3:4 in grids, a fixed per-product shape in the masonry feed. Saves are shared with Drape. */
export function PlusTile({ p, masonry = false, index = 0 }: { p: ProductCard; masonry?: boolean; index?: number }) {
  const { onOpen, onAsk, onMoreLike, showSource } = useActions();
  const saved = useSession((s) => s.saved.includes(p.id));
  const { toggleLike, dislike, track } = useSession.getState();
  const [menu, setMenu] = useState<"ask" | "hide" | null>(null);
  const [gone, setGone] = useState(false);
  if (gone) return null;
  const shape = masonry ? tileShape(p.id).cls : "aspect-[3/4]";
  const open = () => {
    track("view", p);
    onOpen(p);
  };

  return (
    <motion.article initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index % 12, 10) * 0.03, duration: 0.3 }} className="group relative flex flex-col">
      <div className="relative">
        <button type="button" onClick={open} className="block w-full overflow-hidden rounded-xl bg-sand" aria-label={`${p.brand} ${p.title}, ${inr(p.price)}`}>
          <ProductImage src={p.image} alt={p.title} className={`${shape} w-full transition duration-300 group-hover:scale-[1.02]`} />
        </button>
        {showSource && <SourceChip p={p} />}
        <div className="absolute right-2 top-2 flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => toggleLike(p)}
            aria-pressed={saved}
            aria-label={saved ? "Remove from saved" : "Save"}
            className={`rounded-full p-2 shadow-sm backdrop-blur transition ${saved ? "bg-accent text-white" : "bg-white/90 text-ink hover:bg-white"}`}
          >
            <Heart size={15} fill={saved ? "currentColor" : "none"} />
          </button>
          <div className="relative opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
            <button type="button" onClick={() => setMenu(menu === "hide" ? null : "hide")} aria-label="Not for me" className="rounded-full bg-white/90 p-2 text-ink shadow-sm hover:bg-white">
              <ThumbsDown size={15} />
            </button>
            <Menu open={menu === "hide"} onClose={() => setMenu(null)} className="right-0 top-10">
              <div className="px-2.5 py-1 text-xs text-ink-soft">Not for me because…</div>
              {DISLIKE.map((d) => (
                <Item
                  key={d.id}
                  onClick={() => {
                    dislike(p, d.id);
                    setGone(true);
                  }}
                >
                  {d.label}
                </Item>
              ))}
            </Menu>
          </div>
        </div>
        {onAsk && (
          <div className="absolute bottom-2 left-2">
            <button type="button" onClick={() => setMenu(menu === "ask" ? null : "ask")} aria-label="Ask about this" title="Ask about this" className="rounded-full bg-white/90 p-2 text-ink shadow-sm backdrop-blur hover:bg-white">
              <Sparkles size={15} />
            </button>
            <Menu open={menu === "ask"} onClose={() => setMenu(null)} className="bottom-10 left-0">
              <div className="px-2.5 py-1 text-xs text-ink-soft">Ask about this</div>
              {QUICK_ASKS.map((q) => (
                <Item
                  key={q}
                  onClick={() => {
                    setMenu(null);
                    onAsk(p, q);
                  }}
                >
                  {q}
                </Item>
              ))}
              <Item
                onClick={() => {
                  setMenu(null);
                  onAsk(p, null);
                }}
              >
                <span className="text-ink-soft">Ask something else…</span>
              </Item>
            </Menu>
          </div>
        )}
        {onMoreLike && (
          <button
            type="button"
            onClick={() => onMoreLike(p)}
            className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1.5 text-xs text-ink opacity-0 shadow-sm backdrop-blur transition hover:bg-white group-hover:opacity-100 focus-visible:opacity-100"
          >
            <Layers size={13} /> More like this
          </button>
        )}
      </div>
      <div className={`flex flex-col gap-0.5 px-0.5 ${masonry ? "mt-1.5" : "mt-2.5"}`}>
        <span className="truncate text-sm font-semibold">{p.brand}</span>
        <button type="button" onClick={open} className={`text-left leading-snug text-ink-soft hover:underline ${masonry ? "line-clamp-1 text-xs" : "line-clamp-2 text-sm uppercase tracking-wide"}`}>
          {p.title}
        </button>
        <span className={`mt-0.5 font-semibold ${masonry ? "text-sm" : "text-base"}`} title={p.priceApprox ? "Converted from the store's currency" : undefined}>
          {p.priceApprox ? "≈ " : ""}
          {inr(p.price)}
        </span>
      </div>
    </motion.article>
  );
}

/** Where a product comes from: our Typesense catalog or Shopify's Global Catalog. */
export function SourceChip({ p, className = "absolute left-2 top-2" }: { p: Pick<ProductCard, "source">; className?: string }) {
  const shopify = p.source === "shopify";
  return (
    <span
      className={`pointer-events-none rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide shadow-sm backdrop-blur ${shopify ? "bg-[#95BF47]/90 text-white" : "bg-ink/80 text-canvas"} ${className}`}
    >
      {shopify ? "Shopify" : "Typesense"}
    </span>
  );
}

/** Placeholder tile; `shape` matches the masonry tile it stands in for. */
export function PlusSkeleton({ shape = "aspect-[3/4]" }: { shape?: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div className={`skeleton w-full rounded-xl ${shape}`} />
      <div className="skeleton h-3 w-1/2 rounded" />
      <div className="skeleton h-3 w-5/6 rounded" />
    </div>
  );
}
