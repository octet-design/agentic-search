"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Country } from "@/lib/shopify/countries";
import { money, shopifyProductHref } from "@/lib/shopify/format";
import type { StyleItResult } from "@/lib/shopify/styleIt";
import type { ShopifyCard } from "@/lib/shopify/types";
import { ShopifyImage } from "./ShopifyCard";

/** The last response, tagged with what was asked for; "loading" is derived from it. */
type Result = { id: string; asked: string | null; data?: StyleItResult; error?: boolean };

/**
 * "Style it": pick one of 3 occasions, see real pieces from other stores that complete the look.
 * `general` (Scout, any product): a non-fashion product shows "Goes well with" (complementary items) instead.
 */
export function StyleIt({ id, country, onOpen, general }: { id: string; country: Country; onOpen?: (p: ShopifyCard) => void; general?: boolean }) {
  const [result, setResult] = useState<Result | null>(null);
  const [occasion, setOccasion] = useState<string | null>(null);

  useEffect(() => {
    const ac = new AbortController();
    fetch("/api/shopify/style-it", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, country: country.code, ...(occasion ? { occasion } : {}), ...(general ? { general: true } : {}) }),
      signal: ac.signal,
    })
      .then(async (r) => {
        if (!r.ok) throw new Error(String(r.status));
        setResult({ id, asked: occasion, data: (await r.json()) as StyleItResult });
      })
      .catch(() => !ac.signal.aborted && setResult({ id, asked: occasion, error: true }));
    return () => ac.abort();
  }, [id, country.code, occasion, general]);

  const current = result?.id === id ? result : null;
  const loading = !current || current.asked !== occasion;
  // While another occasion loads, keep showing the previous one (faded).
  const data = current?.data;
  if (current?.error && !loading && !data) return null;
  const active = occasion ?? data?.occasion;

  if (data?.kind === "pairs") {
    return (
      <section className="border-t border-line pt-4">
        <h3 className="font-display text-lg">Goes well with</h3>
        <p className="text-sm text-ink-soft">Things people often pick up with this.</p>
        <div className="no-scrollbar -mx-1 mt-3 flex snap-x gap-3 overflow-x-auto px-1 pb-2">
          {data.look.map((it) => (
            <LookCard key={it.product.id} p={it.product} label={it.label} why={it.why} country={country} onOpen={onOpen} />
          ))}
        </div>
        {data.look.length === 0 && <p className="text-sm text-ink-soft">Couldn&apos;t find matching items in stock for this one.</p>}
      </section>
    );
  }

  return (
    <section className="border-t border-line pt-4">
      {/* Any-product mode doesn't know yet whether this is fashion: no title until the answer arrives. */}
      {general && !data ? (
        <span className="skeleton block h-6 w-32 rounded" />
      ) : (
        <>
          <h3 className="font-display text-lg">Style it</h3>
          <p className="text-sm text-ink-soft">Pick an occasion to see how this piece styles.</p>
        </>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {data
          ? data.occasions.map((o) => (
              <button
                key={o.name}
                type="button"
                onClick={() => setOccasion(o.name)}
                aria-pressed={active === o.name}
                className={`rounded-full border px-3 py-1.5 text-sm transition ${active === o.name ? "border-ink bg-ink text-canvas" : "border-line bg-paper hover:border-ink"}`}
              >
                {o.name}
              </button>
            ))
          : Array.from({ length: 3 }, (_, i) => <span key={i} className="skeleton h-8 w-24 rounded-full" />)}
      </div>

      {data && <p className="mt-3 text-sm leading-relaxed">{data.occasions.find((o) => o.name === active)?.note ?? data.note}</p>}

      <div className={`no-scrollbar -mx-1 mt-3 flex snap-x gap-3 overflow-x-auto px-1 pb-2 transition-opacity ${loading && data ? "opacity-50" : ""}`}>
        {data ? (
          <>
            <LookCard p={data.piece} label="This piece" country={country} badge />
            {data.look.map((it) => (
              <LookCard key={it.product.id} p={it.product} label={it.label} why={it.why} country={country} onOpen={onOpen} />
            ))}
          </>
        ) : (
          Array.from({ length: 4 }, (_, i) => <div key={i} className="skeleton aspect-[3/4] w-32 shrink-0 rounded-xl" />)
        )}
      </div>
      {data && !loading && data.look.length === 0 && <p className="text-sm text-ink-soft">Couldn&apos;t find matching pieces in stock for this one.</p>}
    </section>
  );
}

function LookCard({ p, label, why, badge, country, onOpen }: { p: ShopifyCard; label: string; why?: string; badge?: boolean; country: Country; onOpen?: (p: ShopifyCard) => void }) {
  const body = (
    <>
      <div className="relative overflow-hidden rounded-xl bg-sand">
        <ShopifyImage src={p.image} alt={p.title} className="aspect-[3/4] w-full" />
        {badge && <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-medium text-ink">This piece</span>}
      </div>
      <div className="mt-1.5 text-[11px] uppercase tracking-wide text-ink-soft">{label}</div>
      {p.seller && <div className="truncate text-xs font-medium">{p.seller}</div>}
      <div className="line-clamp-2 text-xs leading-snug text-ink-soft">{p.title}</div>
      {p.price && <div className="mt-0.5 text-xs font-semibold">{money(p.price, country.locale)}</div>}
      {why && <div className="mt-1 line-clamp-3 text-[11px] leading-snug text-ink-soft">{why}</div>}
    </>
  );
  const cls = "w-32 shrink-0 snap-start text-left";
  if (badge) return <div className={cls}>{body}</div>;
  return onOpen ? (
    <button type="button" onClick={() => onOpen(p)} className={cls} title={why}>
      {body}
    </button>
  ) : (
    <Link href={shopifyProductHref(p.id, [], country.code)} className={cls} title={why}>
      {body}
    </Link>
  );
}
