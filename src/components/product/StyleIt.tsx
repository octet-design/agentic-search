"use client";

import { useEffect, useState } from "react";
import type { ProductCard as Card } from "@/lib/agent/types";
import { cn, inr } from "@/lib/format";
import type { StyleItResult } from "@/lib/styleIt";
import { ProductImage } from "./ProductImage";

/** The last response, tagged with what was asked for; "loading" is derived from it. */
type Result = { id: string; asked: string | null; data?: StyleItResult; error?: boolean };

/** "Style it": pick an occasion, see real pieces that complete the look with this product. */
export function StyleIt({ p, onOpen }: { p: Card; onOpen?: (p: Card) => void }) {
  const [result, setResult] = useState<Result | null>(null);
  const [occasion, setOccasion] = useState<string | null>(null);
  // Switching products resets the occasion (render-time reset, no effect needed).
  const [forId, setForId] = useState(p.id);
  if (forId !== p.id) {
    setForId(p.id);
    setOccasion(null);
  }

  useEffect(() => {
    const ac = new AbortController();
    fetch("/api/style-it", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: p.id, ...(occasion ? { occasion } : {}) }),
      signal: ac.signal,
    })
      .then(async (r) => {
        if (!r.ok) throw new Error(String(r.status));
        setResult({ id: p.id, asked: occasion, data: (await r.json()) as StyleItResult });
      })
      .catch(() => !ac.signal.aborted && setResult({ id: p.id, asked: occasion, error: true }));
    return () => ac.abort();
  }, [p.id, occasion]);

  const current = result?.id === p.id ? result : null;
  const loading = !current || current.asked !== occasion;
  // While another occasion loads, keep showing the previous one (faded).
  const data = current?.data;
  if (current?.error && !loading && !data) return null;

  return (
    <section>
      <h3 className="font-display text-lg">Style it</h3>
      <p className="text-sm text-ink-soft">Pick an occasion to see how this piece styles.</p>

      <div className="mt-3 flex flex-wrap gap-2">
        {data
          ? data.occasions.map((o) => (
              <button
                key={o.name}
                type="button"
                onClick={() => setOccasion(o.name)}
                aria-pressed={(occasion ?? data.occasion) === o.name}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm transition",
                  (occasion ?? data.occasion) === o.name ? "border-ink bg-ink text-canvas" : "border-line bg-paper hover:border-ink",
                )}
              >
                {o.name}
              </button>
            ))
          : Array.from({ length: 3 }).map((_, i) => <span key={i} className="skeleton h-8 w-24 rounded-full" />)}
      </div>

      {data?.note && <p className="mt-3 text-sm leading-relaxed">{data.note}</p>}

      <div className={cn("no-scrollbar -mx-5 mt-3 flex snap-x gap-3 overflow-x-auto px-5 pb-2 transition-opacity", loading && data && "opacity-50")}>
        <LookCard p={p} label="This piece" badge onOpen={onOpen} />
        {data
          ? data.look.map((it) => <LookCard key={it.product.id} p={it.product} label={it.label} why={it.why} onOpen={onOpen} />)
          : Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton aspect-[3/4] w-32 shrink-0 rounded-xl" />)}
      </div>
      {data && !loading && data.look.length === 0 && <p className="text-sm text-ink-soft">Couldn&apos;t find matching pieces in stock for this one.</p>}
    </section>
  );
}

function LookCard({ p, label, why, badge, onOpen }: { p: Card; label: string; why?: string; badge?: boolean; onOpen?: (p: Card) => void }) {
  return (
    <button type="button" onClick={() => !badge && onOpen?.(p)} className={cn("w-32 shrink-0 snap-start text-left", badge && "cursor-default")} title={why}>
      <div className="relative overflow-hidden rounded-xl bg-sand">
        <ProductImage src={p.image} alt={p.title} className="aspect-[3/4] w-full" />
        {badge && <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-medium text-ink">This piece</span>}
      </div>
      <div className="mt-1.5 text-[11px] uppercase tracking-wide text-ink-soft">{label}</div>
      <div className="truncate text-xs font-medium">{p.brand}</div>
      <div className="line-clamp-2 text-xs leading-snug text-ink-soft">{p.title}</div>
      <div className="mt-0.5 text-xs font-semibold">{inr(p.price)}</div>
      {why && <div className="mt-1 line-clamp-3 text-[11px] leading-snug text-ink-soft">{why}</div>}
    </button>
  );
}
