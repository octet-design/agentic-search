"use client";

import { ProductImage } from "@/components/product/ProductImage";
import type { ProductCard as Card, ChatPick } from "@/lib/agent/types";
import { inr } from "@/lib/format";

/** "Drape's picks": a few products explained like a stylist would, each opening the quick view. */
export function PicksBlock({ picks, cards, onOpen }: { picks: ChatPick[]; cards: Map<number, Card>; onOpen: (p: Card) => void }) {
  const rows = picks.map((x) => ({ x, p: cards.get(x.ref) })).filter((r): r is { x: ChatPick; p: Card } => !!r.p);
  if (!rows.length) return null;
  return (
    <section className="rounded-2xl border border-line bg-paper p-4 md:p-5">
      <h3 className="font-display text-lg leading-tight">My picks for you</h3>
      <ol className="mt-3 flex flex-col divide-y divide-line">
        {rows.map(({ x, p }, i) => (
          <li key={x.ref} className="flex gap-4 py-4 first:pt-1 last:pb-1">
            <button type="button" onClick={() => onOpen(p)} className="w-24 shrink-0 overflow-hidden rounded-xl bg-sand md:w-28" aria-label={`Open ${p.title}`}>
              <ProductImage src={p.image} alt={p.title} className="aspect-[3/4] w-full" />
            </button>
            <div className="min-w-0 flex-1">
              {x.headline && (
                <div className="text-xs font-medium uppercase tracking-wide text-accent">
                  {i + 1}. {x.headline}
                </div>
              )}
              <button type="button" onClick={() => onOpen(p)} className="mt-0.5 text-left font-medium leading-snug hover:underline">
                {p.title}
              </button>
              <div className="mt-0.5 text-sm text-ink-soft">
                {p.brand} · <span className="font-semibold text-ink">{inr(p.price)}</span>
              </div>
              <p className="mt-2 text-[15px] leading-relaxed">{x.why}</p>
              {x.tip && (
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                  <span className="font-medium text-ink">Style tip:</span> {x.tip}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
