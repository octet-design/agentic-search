"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductDetails } from "@/components/product/ProductDetails";
import { Drawer } from "@/components/ui/Drawer";
import { useHydrated } from "@/hooks/useHydrated";
import { useTasteSeeds } from "@/hooks/useTaste";
import type { ProductCard as Card } from "@/lib/agent/types";
import { useSession } from "@/store/session";

/** Liked items, refreshed from /api/products; "More like my saves" = the For you rail (brief §9.8). */
export function SavedView() {
  const saved = useSession((s) => s.saved);
  const disliked = useSession((s) => s.signals.disliked);
  const mounted = useHydrated();
  const seeds = useTasteSeeds();
  const [loaded, setItems] = useState<{ key: string; items: Card[] } | null>(null);
  const [forYou, setForYou] = useState<Card[] | null>(null);
  const [quick, setQuick] = useState<Card | null>(null);
  const key = saved.join(",");
  const items = !saved.length ? [] : loaded?.key === key ? loaded.items : null;

  useEffect(() => {
    if (!mounted || !saved.length) return;
    fetch(`/api/products?ids=${saved.join(",")}`)
      .then((r) => (r.ok ? r.json() : { products: [] }))
      .then((j: { products: Card[] }) => {
        // Fall back to the stored card when a product has left the catalog.
        const byId = new Map(j.products.map((p) => [p.id, p]));
        const cards = useSession.getState().cards;
        setItems({ key, items: saved.map((id) => byId.get(id) ?? cards[id]).filter((p): p is Card => !!p).reverse() });
      })
      .catch(() => setItems({ key, items: [] }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, key]);

  const loadForYou = () => {
    setForYou(null);
    fetch("/api/for-you", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ likedIds: [...new Set([...saved.slice(-6), ...seeds])].slice(0, 10), excludeIds: disliked.map((d) => d.p.id), k: 24 }),
    })
      .then((r) => (r.ok ? r.json() : { products: [] }))
      .then((j: { products: Card[] }) => setForYou(j.products))
      .catch(() => setForYou([]));
  };

  if (!mounted) return null;
  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-8 md:px-8">
      <div className="flex items-end justify-between gap-4">
        <h1 className="font-display text-3xl">Saved</h1>
        {saved.length >= 2 && (
          <button onClick={loadForYou} className="rounded-full border border-ink px-4 py-1.5 text-sm hover:bg-ink hover:text-canvas">
            More like my saves
          </button>
        )}
      </div>
      {items && items.length === 0 && (
        <p className="mt-8 text-ink-soft">
          Nothing saved yet. Tap ♥ on anything you like.{" "}
          <Link href="/" className="text-accent underline">
            Start searching
          </Link>
        </p>
      )}
      <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-5">
        {(items ?? []).map((p, i) => (
          <ProductCard key={p.id} p={p} index={i} onOpen={setQuick} />
        ))}
      </div>
      {forYou !== null && (
        <section className="mt-12">
          <h2 className="mb-3 font-display text-2xl">More like your saves</h2>
          <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-5">
            {forYou.map((p, i) => (
              <ProductCard key={p.id} p={p} index={i} onOpen={setQuick} />
            ))}
          </div>
        </section>
      )}
      <Drawer open={!!quick} onClose={() => setQuick(null)} title={quick?.brand}>
        {quick && <ProductDetails p={quick} onOpen={setQuick} />}
      </Drawer>
    </div>
  );
}
