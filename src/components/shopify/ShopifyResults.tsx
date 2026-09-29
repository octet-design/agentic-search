"use client";

import { useState } from "react";
import type { ShopifyPage } from "@/lib/shopify/types";
import { GRID } from "./grid";
import { ShopifyCard, ShopifySkeleton } from "./ShopifyCard";

/** First page is server-rendered; "Load more" pages through the cursor via /api/shopify/search. */
export function ShopifyResults({ query, initial }: { query: string; initial: ShopifyPage }) {
  const [page, setPage] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadMore() {
    if (!page.cursor) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/shopify/search?${new URLSearchParams({ q: query, cursor: page.cursor })}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Couldn't load more");
      const next = body as ShopifyPage;
      setPage((prev) => {
        const seen = new Set(prev.products.map((p) => p.id));
        return { ...next, products: [...prev.products, ...next.products.filter((p) => !seen.has(p.id))] };
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load more");
    } finally {
      setLoading(false);
    }
  }

  if (!page.products.length) {
    return <p className="py-16 text-center text-ink-soft">No Shopify products found for “{query}”. Try different words.</p>;
  }

  return (
    <>
      <p className="mb-4 text-sm text-ink-soft">
        {page.total != null ? `${page.total.toLocaleString("en-IN")} results` : `${page.products.length} results`} for “{query}”
      </p>
      <div className={GRID}>
        {page.products.map((p) => (
          <ShopifyCard key={p.id} p={p} />
        ))}
        {loading && Array.from({ length: 4 }, (_, i) => <ShopifySkeleton key={`s${i}`} />)}
      </div>
      <div className="mt-10 flex flex-col items-center gap-2">
        {error && <p className="text-sm text-warn">{error}</p>}
        {page.hasNext && page.cursor && (
          <button onClick={loadMore} disabled={loading} className="rounded-full border border-line bg-paper px-5 py-2 text-sm hover:bg-sand disabled:opacity-50">
            {loading ? "Loading…" : "Load more"}
          </button>
        )}
      </div>
    </>
  );
}
