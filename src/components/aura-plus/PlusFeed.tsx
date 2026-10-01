"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ProductCard } from "@/lib/agent/types";
import { placeInColumns, tileShape } from "@/lib/shopify/aura/ux";
import { useSession } from "@/store/session";
import { PlusSkeleton, PlusTile } from "./PlusTile";

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
 * Aura++ "For you": a stable Pinterest-style feed from the Typesense catalog, personalised by what the shopper
 * saved in Drape or Aura++ (shared), mixed with curated picks, paged in as they scroll.
 */
export function PlusFeed() {
  const [items, setItems] = useState<ProductCard[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  // Read once: the feed shouldn't reshuffle while the shopper saves things on it.
  const [seeds] = useState(() => {
    const s = useSession.getState();
    return { seedIds: s.saved.slice(-10), hidden: s.signals.disliked.map((d) => d.p.id) };
  });
  const busy = useRef(false);
  const ids = useRef(new Set<string>());
  const sentinel = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const columns = useColumns(grid);
  // Placed once per item: appending a page never moves the tiles already on screen.
  const placed = useMemo(() => placeInColumns(items, columns, (p) => tileShape(p.id).ratio), [items, columns]);

  const load = async () => {
    if (busy.current) return;
    busy.current = true;
    setLoading(true);
    try {
      const res = await fetch("/api/aura-plus/feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seedIds: seeds.seedIds, excludeIds: [...seeds.hidden, ...ids.current].slice(-300), cursor }),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { items: ProductCard[]; cursor: string };
      const fresh = data.items.filter((i) => !ids.current.has(i.id));
      fresh.forEach((i) => ids.current.add(i.id));
      setItems((prev) => [...prev, ...fresh]);
      setCursor(data.cursor);
      setError(false);
    } catch {
      setError(true);
    } finally {
      busy.current = false;
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver((e) => e.some((x) => x.isIntersecting) && items.length > 0 && !error && void load(), { rootMargin: "900px" });
    io.observe(el);
    return () => io.disconnect();
  });

  const personal = items.some((i) => i.reason);

  return (
    <section>
      <div className="mb-6">
        <h2 className="font-display text-3xl tracking-tight md:text-4xl">{personal ? "For you" : "Explore"}</h2>
        <p className="mt-1 text-sm text-ink-soft">{personal ? "Close to things you saved, mixed with fresh finds." : "Fresh finds from the catalog. Save what you like and this feed learns your taste."}</p>
      </div>
      <div ref={grid} className="flex items-start gap-4 md:gap-5">
        {items.length
          ? placed.map((col, ci) => (
              <div key={ci} className="flex min-w-0 flex-1 flex-col gap-6">
                {col.map((p) => (
                  <PlusTile key={p.id} p={p} masonry />
                ))}
              </div>
            ))
          : loading &&
            Array.from({ length: columns }, (_, ci) => (
              <div key={ci} className="flex min-w-0 flex-1 flex-col gap-6">
                {Array.from({ length: 3 }, (_, i) => (
                  <PlusSkeleton key={i} shape={SKELETON_SHAPES[(ci + i) % SKELETON_SHAPES.length]} />
                ))}
              </div>
            ))}
      </div>
      {loading && items.length > 0 && (
        <div className="flex justify-center py-8">
          <Loader2 size={20} className="animate-spin text-ink-faint" aria-label="Loading more" />
        </div>
      )}
      {error && (
        <div className="py-8 text-center text-sm text-ink-soft">
          Couldn&rsquo;t load more right now.{" "}
          <button onClick={() => void load()} className="font-medium text-ink underline underline-offset-2">
            Try again
          </button>
        </div>
      )}
      <div ref={sentinel} className="h-10" />
    </section>
  );
}
