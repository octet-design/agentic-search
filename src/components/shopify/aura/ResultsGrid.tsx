"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { SectionBlock } from "@/lib/shopify/aura/store";
import type { Country } from "@/lib/shopify/countries";
import type { ShopifyCard, ShopifyPage } from "@/lib/shopify/types";
import { ProductTile, TileSkeleton } from "./ProductTile";

function searchUrl(block: SectionBlock, country: Country, cursor: string | null) {
  const s = block.search!;
  const qs = new URLSearchParams({ q: s.query, country: country.code });
  if (s.min != null) qs.set("min", String(s.min));
  if (s.max != null) qs.set("max", String(s.max));
  if (s.local) qs.set("local", "1");
  if (s.like) qs.set("like", s.like);
  if (s.shop) qs.set("shop", s.shop);
  if (cursor) qs.set("cursor", cursor);
  return `/api/shopify/search?${qs}`;
}

/**
 * The live results for one result set: the agent's products first (they carry chat refs), then the same search
 * paged in as you scroll.
 */
export function ResultsGrid({ block, country, hidden }: { block: SectionBlock; country: Country; hidden: Set<string> }) {
  const [more, setMore] = useState<ShopifyCard[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [done, setDone] = useState(!block.search);
  const [loading, setLoading] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  const load = async () => {
    if (loading || done || !block.search) return;
    setLoading(true);
    try {
      const r = await fetch(searchUrl(block, country, started.current ? cursor : null));
      const page = (await r.json()) as ShopifyPage;
      if (!r.ok) throw new Error();
      started.current = true;
      setMore((prev) => [...prev, ...page.products]);
      setCursor(page.cursor);
      setDone(!page.hasNext || !page.cursor);
    } catch {
      setDone(true);
    } finally {
      setLoading(false);
    }
  };

  // Load the next page when the bottom comes into view.
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && void load(), { rootMargin: "600px" });
    io.observe(el);
    return () => io.disconnect();
  });

  const seen = new Set<string>();
  const products = [...block.products, ...more].filter((p) => !hidden.has(p.id) && !seen.has(p.id) && (seen.add(p.id), true));

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="font-display text-2xl tracking-tight">{block.title}</h2>
        {block.why && <p className="text-sm text-ink-soft">{block.why}</p>}
      </div>
      {products.length === 0 && block.loaded && !loading && <p className="py-16 text-center text-ink-soft">{block.note ?? "Nothing found for this one. Try different words."}</p>}
      <div className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 xl:grid-cols-4">
        {products.map((p, i) => (
          <ProductTile key={p.id} p={p} index={i} />
        ))}
        {loading && products.length === 0 && Array.from({ length: 8 }, (_, i) => <TileSkeleton key={`s${i}`} />)}
      </div>
      <div ref={sentinel} className="flex h-16 items-center justify-center">
        {loading && products.length > 0 && <Loader2 size={18} className="animate-spin text-ink-faint" />}
      </div>
    </div>
  );
}
