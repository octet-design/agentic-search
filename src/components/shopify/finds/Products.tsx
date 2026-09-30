"use client";

import { motion } from "framer-motion";
import { ChevronRight, Heart, Layers, Star, ThumbsDown } from "lucide-react";
import { createContext, useContext, useState } from "react";
import { ShopifyImage } from "@/components/shopify/ShopifyCard";
import { useFinds, type SectionBlock } from "@/lib/shopify/chat/store";
import type { Country } from "@/lib/shopify/countries";
import { money } from "@/lib/shopify/format";
import type { ShopifyCard } from "@/lib/shopify/types";

/** What a card can do in the current screen; missing actions are simply not shown. */
export type CardActions = {
  country: Country;
  onOpen: (p: ShopifyCard) => void;
  onMoreLike?: (p: ShopifyCard) => void;
  onHide?: (p: ShopifyCard, reason: string) => void;
  compare?: { ids: string[]; toggle: (p: ShopifyCard) => void; max: number };
};
export const CardActionsContext = createContext<CardActions | null>(null);
const useActions = () => {
  const a = useContext(CardActionsContext);
  if (!a) throw new Error("CardActionsContext missing");
  return a;
};

const DISLIKE = ["Too pricey", "Not my style", "Colour", "Fabric", "Other"];

export const priceLabel = (p: Pick<ShopifyCard, "price" | "priceFrom">, country: Country) =>
  p.price ? `${p.priceFrom ? "from " : ""}${money(p.price, country.locale)}` : null;

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
  const saved = useFinds((s) => s.saved.some((x) => x.id === p.id));
  const toggleSave = useFinds((s) => s.toggleSave);
  return (
    <button
      type="button"
      onClick={() => toggleSave(p, country.code)}
      aria-pressed={saved}
      aria-label={saved ? "Remove from saved" : "Save"}
      className={`rounded-full p-2 shadow-sm backdrop-blur transition ${saved ? "bg-accent text-white" : "bg-white/85 text-ink hover:bg-white"} ${className}`}
    >
      <Heart size={15} fill={saved ? "currentColor" : "none"} />
    </button>
  );
}

export function FindsCard({ p, index = 0, wide = false }: { p: ShopifyCard; index?: number; wide?: boolean }) {
  const { country, onOpen, onMoreLike, onHide, compare } = useActions();
  const [menu, setMenu] = useState(false);
  const inCompare = !!compare?.ids.includes(p.id);
  const compareFull = !!compare && compare.ids.length >= compare.max;

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 10) * 0.03, duration: 0.25 }}
      className={`group relative flex flex-col ${wide ? "" : "w-44 shrink-0 snap-start sm:w-52"}`}
    >
      <button
        type="button"
        onClick={() => onOpen(p)}
        className="block aspect-[3/4] w-full overflow-hidden rounded-xl bg-sand transition-transform duration-200 group-hover:-translate-y-0.5"
        aria-label={`${p.title}${p.seller ? ` from ${p.seller}` : ""}`}
      >
        <ShopifyImage src={p.image} alt={p.title} className="h-full w-full" />
      </button>

      <div className="absolute right-2 top-2 flex flex-col gap-1.5">
        <SaveButton p={p} country={country} />
        {onHide && (
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
                    key={d}
                    role="menuitem"
                    className="block w-full rounded-lg px-2 py-1.5 text-left text-sm hover:bg-sand"
                    onClick={() => {
                      setMenu(false);
                      onHide(p, d);
                    }}
                  >
                    {d}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-2 flex flex-1 flex-col gap-1 px-0.5">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-xs font-medium uppercase tracking-wide text-ink-soft">{p.seller ?? "Online store"}</span>
          <span className="shrink-0 text-sm font-semibold">{priceLabel(p, country)}</span>
        </div>
        <button type="button" onClick={() => onOpen(p)} className="line-clamp-2 text-left text-sm leading-snug hover:underline">
          {p.title}
        </button>
        <Rating r={p.rating} />
        {(onMoreLike || compare) && (
          <div className="mt-auto flex items-center gap-3 pt-1.5 text-xs text-ink-soft">
            {onMoreLike && (
              <button type="button" onClick={() => onMoreLike(p)} className="inline-flex items-center gap-1 hover:text-ink">
                <Layers size={13} /> More like this
              </button>
            )}
            {compare && (
              <label className={`ml-auto inline-flex cursor-pointer items-center gap-1 ${!inCompare && compareFull ? "opacity-40" : ""}`}>
                <input type="checkbox" className="accent-[var(--color-accent)]" checked={inCompare} disabled={!inCompare && compareFull} onChange={() => compare.toggle(p)} />
                Compare
              </label>
            )}
          </div>
        )}
      </div>
    </motion.article>
  );
}

export function CardSkeleton({ wide = false }: { wide?: boolean }) {
  return (
    <div className={`flex flex-col gap-2 ${wide ? "" : "w-44 shrink-0 sm:w-52"}`}>
      <div className="skeleton aspect-[3/4] w-full rounded-xl" />
      <div className="skeleton h-3 w-1/2 rounded" />
      <div className="skeleton h-3 w-5/6 rounded" />
    </div>
  );
}

/** One search's results: heading, why line, "See all", and a horizontal row (skeletons while it loads). */
export function ProductRow({ block, hidden, onSeeAll }: { block: SectionBlock; hidden: Set<string>; onSeeAll: (b: SectionBlock) => void }) {
  const products = block.products.filter((p) => !hidden.has(p.id));
  return (
    <section>
      <div className="mb-2 flex items-end justify-between gap-3">
        <div>
          <h3 className="font-display text-lg leading-tight">{block.title}</h3>
          {block.why && <p className="text-sm text-ink-soft">{block.why}</p>}
        </div>
        {block.loaded && block.search && products.length > 0 && (
          <button type="button" onClick={() => onSeeAll(block)} className="inline-flex shrink-0 items-center gap-1 text-sm text-ink-soft hover:text-ink">
            See all <ChevronRight size={14} />
          </button>
        )}
      </div>
      <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1">
        {block.loaded ? products.map((p, i) => <FindsCard key={p.id} p={p} index={i} />) : Array.from({ length: 5 }, (_, i) => <CardSkeleton key={i} />)}
        {block.loaded && products.length === 0 && <p className="py-6 text-sm text-ink-soft">{block.note ?? "Nothing found for this one."}</p>}
      </div>
    </section>
  );
}
