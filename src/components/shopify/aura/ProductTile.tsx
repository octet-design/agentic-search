"use client";

import { motion } from "framer-motion";
import { Heart, Layers, Sparkles, Star, ThumbsDown } from "lucide-react";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { ShopifyImage } from "@/components/shopify/ShopifyCard";
import { useAura } from "@/lib/shopify/aura/store";
import { track } from "@/lib/shopify/aura/taste";
import type { Country } from "@/lib/shopify/countries";
import { tileShape } from "@/lib/shopify/aura/ux";
import { money } from "@/lib/shopify/format";
import type { ShopifyCard } from "@/lib/shopify/types";

/** What a tile can do on the current screen; missing actions are simply not shown. */
export type TileActions = {
  country: Country;
  onOpen: (p: ShopifyCard) => void;
  /** ✦ Ask about this product (a quick question, or null to just start typing about it). */
  onAsk?: (p: ShopifyCard, question: string | null) => void;
  onMoreLike?: (p: ShopifyCard) => void;
  onHide?: (p: ShopifyCard, reason: string) => void;
};
export const TileActionsContext = createContext<TileActions | null>(null);
export const useTileActions = () => {
  const a = useContext(TileActionsContext);
  if (!a) throw new Error("TileActionsContext missing");
  return a;
};

const QUICK_ASKS = ["Is it true to size?", "What goes with it?", "Cheaper alternatives?"];
const DISLIKE = ["Too pricey", "Not my style", "Colour", "Fabric", "Other"];

export const priceLabel = (p: Pick<ShopifyCard, "price" | "priceFrom" | "priceApprox">, country: Country) =>
  p.price ? `${p.priceApprox ? "≈ " : ""}${p.priceFrom ? "from " : ""}${money(p.price, country.locale)}` : null;

export function Rating({ r }: { r: ShopifyCard["rating"] }) {
  if (!r) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-ink-soft">
      <Star size={12} className="fill-current text-accent" /> {r.value.toFixed(1)}
      {r.count != null && <span className="text-ink-faint">({r.count})</span>}
    </span>
  );
}

export function SaveButton({ p, country, className = "" }: { p: ShopifyCard; country: Country; className?: string }) {
  const saved = useAura((s) => s.saved.some((x) => x.id === p.id));
  const toggleSave = useAura((s) => s.toggleSave);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        if (!saved) track({ type: "save", product: p });
        toggleSave(p, country.code);
      }}
      aria-pressed={saved}
      aria-label={saved ? "Remove from saved" : "Save"}
      className={`rounded-full p-2 shadow-sm backdrop-blur transition ${saved ? "bg-accent text-white" : "bg-white/90 text-ink hover:bg-white"} ${className}`}
    >
      <Heart size={15} fill={saved ? "currentColor" : "none"} />
    </button>
  );
}

/** Small popover anchored to a button; closes on outside click. */
function Popover({ open, onClose, className, children }: { open: boolean; onClose: () => void; className: string; children: React.ReactNode }) {
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

const MenuItem = ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => (
  <button role="menuitem" onClick={onClick} className="block w-full rounded-lg px-2.5 py-1.5 text-left text-sm hover:bg-sand">
    {children}
  </button>
);

/** Product card for grids (3:4) and the masonry feed (a fixed per-product shape, so nothing shifts as images load). */
export function ProductTile({ p, index = 0, masonry = false }: { p: ShopifyCard; index?: number; masonry?: boolean }) {
  const shape = masonry ? tileShape(p.id).cls : "aspect-[3/4]";
  const { country, onOpen, onAsk, onMoreLike, onHide } = useTileActions();
  const [menu, setMenu] = useState<"ask" | "hide" | null>(null);
  const open = () => {
    track({ type: "open", product: p });
    onOpen(p);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index % 12, 10) * 0.03, duration: 0.3 }}
      className="group relative flex flex-col"
    >
      <div className="relative">
        <button type="button" onClick={open} className="block w-full overflow-hidden rounded-xl bg-sand" aria-label={`${p.title}${p.seller ? ` from ${p.seller}` : ""}`}>
          <ShopifyImage src={p.image} alt={p.title} className={`${shape} w-full transition duration-300 group-hover:scale-[1.02]`} />
        </button>
        <div className="absolute right-2 top-2 flex flex-col gap-1.5">
          <SaveButton p={p} country={country} />
          {onHide && (
            <div className="relative opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
              <button type="button" onClick={() => setMenu(menu === "hide" ? null : "hide")} aria-label="Not for me" className="rounded-full bg-white/90 p-2 text-ink shadow-sm hover:bg-white">
                <ThumbsDown size={15} />
              </button>
              <Popover open={menu === "hide"} onClose={() => setMenu(null)} className="right-0 top-10">
                <div className="px-2.5 py-1 text-xs text-ink-soft">Not for me because…</div>
                {DISLIKE.map((d) => (
                  <MenuItem
                    key={d}
                    onClick={() => {
                      setMenu(null);
                      onHide(p, d);
                    }}
                  >
                    {d}
                  </MenuItem>
                ))}
              </Popover>
            </div>
          )}
        </div>
        {onAsk && (
          <div className="absolute bottom-2 left-2">
            <button
              type="button"
              onClick={() => setMenu(menu === "ask" ? null : "ask")}
              aria-label="Ask about this"
              title="Ask about this"
              className="rounded-full bg-white/90 p-2 text-ink shadow-sm backdrop-blur hover:bg-white"
            >
              <Sparkles size={15} />
            </button>
            <Popover open={menu === "ask"} onClose={() => setMenu(null)} className="bottom-10 left-0">
              <div className="px-2.5 py-1 text-xs text-ink-soft">Ask about this</div>
              {QUICK_ASKS.map((q) => (
                <MenuItem
                  key={q}
                  onClick={() => {
                    setMenu(null);
                    onAsk(p, q);
                  }}
                >
                  {q}
                </MenuItem>
              ))}
              <MenuItem
                onClick={() => {
                  setMenu(null);
                  onAsk(p, null);
                }}
              >
                <span className="text-ink-soft">Ask something else…</span>
              </MenuItem>
            </Popover>
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
        <span className="truncate text-sm font-semibold">{p.seller ?? "Online store"}</span>
        <button type="button" onClick={open} className={`text-left leading-snug text-ink-soft hover:underline ${masonry ? "line-clamp-1 text-xs" : "line-clamp-2 text-sm uppercase tracking-wide"}`}>
          {p.title}
        </button>
        <div className="mt-0.5 flex items-center gap-2">
          <span className={`font-semibold ${masonry ? "text-sm" : "text-base"}`}>{priceLabel(p, country)}</span>
          {!masonry && <Rating r={p.rating} />}
        </div>
      </div>
    </motion.article>
  );
}

/** Placeholder tile; `shape` matches the masonry tile it stands in for. */
export function TileSkeleton({ shape = "aspect-[3/4]" }: { shape?: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div className={`skeleton w-full rounded-xl ${shape}`} />
      <div className="skeleton h-3 w-1/2 rounded" />
      <div className="skeleton h-3 w-5/6 rounded" />
    </div>
  );
}
