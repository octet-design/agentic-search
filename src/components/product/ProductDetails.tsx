"use client";

import { ExternalLink, Heart } from "lucide-react";
import { useEffect, useState } from "react";
import type { ProductCard as Card } from "@/lib/agent/types";
import { cn, inr, outboundUrl } from "@/lib/format";
import { useSession } from "@/store/session";
import { ProductCard } from "./ProductCard";
import { ProductImage } from "./ProductImage";

const titleCase = (s: string | null) => (s ? s.replace(/\b\w/g, (c) => c.toUpperCase()) : "—");

/** Shared by the quick-view drawer and /p/[id]. */
export function ProductDetails({ p, onOpen, showSimilar = true }: { p: Card; onOpen?: (p: Card) => void; showSimilar?: boolean }) {
  const saved = useSession((s) => s.saved.includes(p.id));
  const { toggleLike, click } = useSession.getState();
  const [similarState, setSimilar] = useState<{ id: string; products: Card[] } | null>(null);
  const similar = similarState?.id === p.id ? similarState.products : null;

  useEffect(() => {
    if (!showSimilar) return;
    let cancelled = false;
    fetch("/api/similar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: p.id, k: 12 }) })
      .then((r) => (r.ok ? r.json() : { products: [] }))
      .then((j: { products: Card[] }) => !cancelled && setSimilar({ id: p.id, products: j.products ?? [] }))
      .catch(() => !cancelled && setSimilar({ id: p.id, products: [] }));
    return () => {
      cancelled = true;
    };
  }, [p.id, showSimilar]);

  const rows: [string, string][] = [
    ["Fabric", titleCase(p.fabric)],
    ["Fit", titleCase(p.fit)],
    ["Pattern", titleCase(p.pattern)],
    ["Colour", titleCase(p.color)],
    ["Occasion", p.useCase.length ? p.useCase.map(titleCase).join(", ") : "—"],
  ];

  return (
    <div className="flex flex-col gap-5 p-5">
      <div className="overflow-hidden rounded-xl bg-sand">
        <ProductImage src={p.image} alt={p.title} className="aspect-[3/4] w-full" />
      </div>
      <div>
        <div className="text-xs font-medium uppercase tracking-wide text-ink-soft">{p.brand}</div>
        <h2 className="mt-1 font-display text-xl leading-snug">{p.title}</h2>
        <div className="mt-2 text-lg font-semibold">{inr(p.price)}</div>
        {p.reason && <p className="mt-3 rounded-lg bg-accent-soft px-3 py-2 text-sm text-ink">{p.reason}</p>}
      </div>

      <div className="flex gap-2">
        <a
          href={outboundUrl(p.url)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => click(p)}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-medium text-canvas hover:bg-ink/90"
        >
          Shop on {p.domain || "brand site"} <ExternalLink size={15} />
        </a>
        <button
          type="button"
          onClick={() => toggleLike(p)}
          aria-pressed={saved}
          aria-label={saved ? "Remove from saved" : "Save"}
          className={cn("rounded-full border px-4", saved ? "border-accent bg-accent text-white" : "border-line hover:bg-sand")}
        >
          <Heart size={17} fill={saved ? "currentColor" : "none"} />
        </button>
      </div>

      <dl className="grid grid-cols-[6rem_1fr] gap-y-2 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-ink-soft">{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>

      {p.sizes.length > 0 && (
        <div>
          <div className="mb-2 text-sm text-ink-soft">Sizes listed</div>
          <div className="flex flex-wrap gap-1.5">
            {p.sizes.slice(0, 24).map((s) => (
              <span key={s} className="rounded-md border border-line px-2 py-1 text-xs">
                {s}
              </span>
            ))}
          </div>
          <p className="mt-2 text-xs text-ink-faint">Availability per size is on the brand&apos;s site.</p>
        </div>
      )}

      {showSimilar && (
        <div>
          <h3 className="mb-3 font-display text-lg">More like this</h3>
          <div className="no-scrollbar -mx-5 flex snap-x gap-3 overflow-x-auto px-5 pb-2">
            {similar === null
              ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton aspect-[3/4] w-36 shrink-0 rounded-xl" />)
              : similar.length === 0
                ? <p className="text-sm text-ink-soft">No close matches found.</p>
                : similar.map((s, i) => <ProductCard key={s.id} p={s} index={i} compact onOpen={(x) => onOpen?.(x)} />)}
          </div>
        </div>
      )}
    </div>
  );
}
