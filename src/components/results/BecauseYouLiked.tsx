"use client";

import { useEffect, useMemo, useState } from "react";
import { ProductCard } from "@/components/product/ProductCard";
import type { ProductCard as Card } from "@/lib/agent/types";
import { useSession } from "@/store/session";

/** "Because you liked <item>" on results pages, when a liked item matches the results' category (§8.3). */
export function BecauseYouLiked({ results, onOpen }: { results: Card[]; onOpen: (p: Card) => void }) {
  const liked = useSession((s) => s.signals.liked);
  const disliked = useSession((s) => s.signals.disliked);
  const [state, setState] = useState<{ id: string; products: Card[] } | null>(null);

  const source = useMemo(() => {
    if (liked.length < 2 || !results.length) return null;
    const counts = new Map<string, number>();
    for (const p of results) counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    const shown = new Set(results.map((p) => p.id));
    return [...liked].reverse().find((l) => l.category === top && !shown.has(l.id)) ?? null;
  }, [liked, results]);

  useEffect(() => {
    if (!source) return;
    let cancelled = false;
    fetch("/api/similar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: source.id, k: 12, excludeIds: [...results.map((p) => p.id), ...disliked.map((d) => d.p.id)].slice(0, 200) }),
    })
      .then((r) => (r.ok ? r.json() : { products: [] }))
      .then((j: { products: Card[] }) => !cancelled && setState({ id: source.id, products: j.products }))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source?.id]);

  const products = source && state?.id === source.id ? state.products : [];
  if (!source || !products.length) return null;
  return (
    <section className="mt-12">
      <h2 className="mb-3 font-display text-xl">Because you liked {source.title ?? "something similar"}</h2>
      <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 md:-mx-8 md:px-8">
        {products.map((p, i) => (
          <ProductCard key={p.id} p={p} index={i} compact onOpen={onOpen} />
        ))}
      </div>
    </section>
  );
}
