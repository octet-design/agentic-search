"use client";

import { motion } from "framer-motion";
import { Check, Heart, Layers, ThumbsDown } from "lucide-react";
import { useState } from "react";
import type { ProductCard as Card } from "@/lib/agent/types";
import { cn, inr } from "@/lib/format";
import { useSession, type DislikeReason } from "@/store/session";
import { ProductImage } from "./ProductImage";

const DISLIKE: { id: DislikeReason; label: string }[] = [
  { id: "price", label: "Too pricey" },
  { id: "style", label: "Not my style" },
  { id: "color", label: "Colour" },
  { id: "fabric", label: "Fabric" },
  { id: "other", label: "Other" },
];

export function ProductCard({
  p,
  onOpen,
  onMoreLike,
  index = 0,
  compact = false,
}: {
  p: Card;
  onOpen: (p: Card) => void;
  onMoreLike?: (p: Card) => void;
  index?: number;
  compact?: boolean;
}) {
  const saved = useSession((s) => s.saved.includes(p.id));
  const inCompare = useSession((s) => s.compare.includes(p.id));
  const compareFull = useSession((s) => s.compare.length >= 3);
  const { toggleLike, dislike, toggleCompare } = useSession.getState();
  const [menu, setMenu] = useState(false);
  const [gone, setGone] = useState(false);

  if (gone) return null;

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ delay: Math.min(index, 12) * 0.03, duration: 0.25 }}
      className={cn("group relative flex flex-col", compact ? "w-44 shrink-0 snap-start sm:w-52" : "")}
    >
      <button
        type="button"
        onClick={() => onOpen(p)}
        className="relative block aspect-[3/4] w-full overflow-hidden rounded-xl bg-sand text-left transition-transform duration-200 group-hover:-translate-y-0.5"
        aria-label={`${p.brand} ${p.title}, ${inr(p.price)}`}
      >
        <ProductImage src={p.image} alt={p.title} className="h-full w-full" />
      </button>

      <div className="absolute right-2 top-2 flex flex-col gap-1.5">
        <button
          type="button"
          onClick={() => toggleLike(p)}
          aria-pressed={saved}
          aria-label={saved ? "Remove from saved" : "Save"}
          className={cn("rounded-full p-2 shadow-sm backdrop-blur transition", saved ? "bg-accent text-white" : "bg-white/85 text-ink hover:bg-white")}
        >
          <Heart size={15} fill={saved ? "currentColor" : "none"} />
        </button>
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenu((m) => !m)}
            aria-label="Not for me"
            aria-expanded={menu}
            className="rounded-full bg-white/85 p-2 text-ink shadow-sm backdrop-blur hover:bg-white"
          >
            <ThumbsDown size={15} />
          </button>
          {menu && (
            <div className="absolute right-0 top-10 z-20 w-40 rounded-xl border border-line bg-paper p-1 shadow-lg" role="menu">
              <div className="px-2 py-1 text-xs text-ink-soft">Not for me because…</div>
              {DISLIKE.map((d) => (
                <button
                  key={d.id}
                  role="menuitem"
                  className="block w-full rounded-lg px-2 py-1.5 text-left text-sm hover:bg-sand"
                  onClick={() => {
                    dislike(p, d.id);
                    setMenu(false);
                    setGone(true);
                  }}
                >
                  {d.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-2 flex flex-1 flex-col gap-1 px-0.5">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-xs font-medium uppercase tracking-wide text-ink-soft">{p.brand}</span>
          <span className="shrink-0 text-sm font-semibold">{inr(p.price)}</span>
        </div>
        <button type="button" onClick={() => onOpen(p)} className="line-clamp-2 text-left text-sm leading-snug hover:underline">
          {p.title}
        </button>
        {p.reason && <p className="line-clamp-2 text-xs leading-snug text-ink-soft">{p.reason}</p>}
        {p.matched.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {p.matched.slice(0, 3).map((m) => (
              <span key={m} className="inline-flex items-center gap-0.5 rounded-full bg-accent-soft px-1.5 py-0.5 text-[11px] text-accent">
                <Check size={10} /> {m}
              </span>
            ))}
          </div>
        )}
        <div className="mt-auto flex items-center gap-3 pt-1.5 text-xs text-ink-soft">
          {onMoreLike && (
            <button type="button" onClick={() => onMoreLike(p)} className="inline-flex items-center gap-1 hover:text-ink">
              <Layers size={13} /> More like this
            </button>
          )}
          <label className={cn("ml-auto inline-flex cursor-pointer items-center gap-1", !inCompare && compareFull && "opacity-40")}>
            <input type="checkbox" className="accent-[var(--color-accent)]" checked={inCompare} disabled={!inCompare && compareFull} onChange={() => toggleCompare(p)} />
            Compare
          </label>
        </div>
      </div>
    </motion.article>
  );
}

export function ProductSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn("flex flex-col gap-2", compact && "w-44 shrink-0 sm:w-52")}>
      <div className="skeleton aspect-[3/4] w-full rounded-xl" />
      <div className="skeleton h-3 w-1/2 rounded" />
      <div className="skeleton h-3 w-5/6 rounded" />
      <div className="skeleton h-3 w-2/3 rounded" />
    </div>
  );
}
