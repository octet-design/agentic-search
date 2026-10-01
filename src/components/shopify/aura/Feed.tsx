"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAura } from "@/lib/shopify/aura/store";
import { feedSeeds, track } from "@/lib/shopify/aura/taste";
import { placeInColumns, tileShape } from "@/lib/shopify/aura/ux";
import type { FeedItem, FeedPage } from "@/lib/shopify/feed";
import type { Country } from "@/lib/shopify/countries";
import { ProductTile, TileSkeleton } from "./ProductTile";

/** Column count for the container width (same breakpoints as the rest of Aura). */
function useColumns(ref: React.RefObject<HTMLDivElement | null>) {
  const [n, setN] = useState(4);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = (w: number) => setN(w < 640 ? 2 : w < 900 ? 3 : w < 1200 ? 4 : 5);
    fit(el.clientWidth);
    const ro = new ResizeObserver(([e]) => fit(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return n;
}

const SKELETON_SHAPES = ["aspect-[3/4]", "aspect-[2/3]", "aspect-square", "aspect-[4/5]"];

/**
 * Pinterest-style "For you" feed: seeded by what this shopper saved, opened and searched (this browser only),
 * mixed with curated fashion for their country, and paged in as they scroll.
 */
export function Feed({ country }: { country: Country }) {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [seeds] = useState(() => feedSeeds(useAura.getState().saved));
  const page = useRef(0);
  const sentinel = useRef<HTMLDivElement>(null);
  const busy = useRef(false);
  const ids = useRef(new Set<string>());
  const grid = useRef<HTMLDivElement>(null);
  const columns = useColumns(grid);
  // Placed once per item: appending a page never moves the tiles already on screen.
  const placed = useMemo(() => placeInColumns(items, columns, (p) => tileShape(p.id).ratio), [items, columns]);

  const load = async (reset = false) => {
    if (busy.current) return;
    busy.current = true;
    setLoading(true);
    try {
      const res = await fetch("/api/shopify/feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country: country.code, seeds, cursor: reset ? null : cursor, exclude: [...ids.current].slice(-300) }),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as FeedPage;
      const fresh = data.items.filter((i) => !ids.current.has(i.id));
      fresh.forEach((i) => ids.current.add(i.id));
      setItems((prev) => (reset ? fresh : [...prev, ...fresh]));
      setCursor(data.cursor);
      setError(false);
      track({ type: "feed_page", page: ++page.current });
    } catch {
      setError(true);
    } finally {
      busy.current = false;
      setLoading(false);
    }
  };

  // First page, and a fresh feed when the country changes.
  useEffect(() => {
    ids.current = new Set();
    page.current = 0;
    void load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country.code]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver((e) => e.some((x) => x.isIntersecting) && items.length > 0 && !error && void load(), { rootMargin: "900px" });
    io.observe(el);
    return () => io.disconnect();
  });

  const reasons = [...new Set(items.slice(0, 40).map((i) => i.reason).filter((r): r is string => !!r))].slice(0, 3);

  return (
    <section>
      <div className="mb-6">
        <h2 className="font-display text-3xl tracking-tight md:text-4xl">{reasons.length ? "For you" : "Explore"}</h2>
        <p className="mt-1 text-sm text-ink-soft">{reasons.length ? reasons.join(" · ") : `Fresh finds from stores that deliver to ${country.name}. Save and open what you like and this feed learns your taste.`}</p>
      </div>
      <div ref={grid} className="flex items-start gap-4 md:gap-5">
        {items.length
          ? placed.map((col, ci) => (
              <div key={ci} className="flex min-w-0 flex-1 flex-col gap-6">
                {col.map((p) => (
                  <ProductTile key={p.id} p={p} index={0} masonry />
                ))}
              </div>
            ))
          : loading &&
            Array.from({ length: columns }, (_, ci) => (
              <div key={ci} className="flex min-w-0 flex-1 flex-col gap-6">
                {Array.from({ length: 3 }, (_, i) => (
                  <TileSkeleton key={i} shape={SKELETON_SHAPES[(ci + i) % SKELETON_SHAPES.length]} />
                ))}
              </div>
            ))}
      </div>
      {loading && items.length > 0 && (
        <div className="flex justify-center py-8" aria-live="polite">
          <Loader2 size={20} className="animate-spin text-ink-faint" aria-label="Loading more" />
        </div>
      )}
      {error && (
        <div className="py-8 text-center text-sm text-ink-soft">
          Couldn&rsquo;t load more right now.{" "}
          <button onClick={() => void load(!items.length)} className="font-medium text-ink underline underline-offset-2">
            Try again
          </button>
        </div>
      )}
      <div ref={sentinel} className="h-10" />
    </section>
  );
}
