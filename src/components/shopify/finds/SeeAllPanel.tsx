"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { SectionBlock } from "@/lib/shopify/chat/store";
import type { Country } from "@/lib/shopify/countries";
import type { ShopifyCard, ShopifyPage } from "@/lib/shopify/types";
import { CardSkeleton, FindsCard } from "./Products";

function url(block: SectionBlock, country: Country, cursor: string | null) {
  const s = block.search!;
  const qs = new URLSearchParams({ q: s.query, country: country.code });
  if (s.min != null) qs.set("min", String(s.min));
  if (s.max != null) qs.set("max", String(s.max));
  if (s.local) qs.set("local", "1");
  if (cursor) qs.set("cursor", cursor);
  return `/api/shopify/search?${qs}`;
}

/**
 * "See all" for a chat row: the same search (query, budget, local-only) without the agent, as a longer grid
 * with Load more. Rendered inside the wide Sheet by the chat.
 */
export function SeeAllBody({ block, country, hidden }: { block: SectionBlock; country: Country; hidden: Set<string> }) {
  const [items, setItems] = useState<ShopifyCard[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const add = (page: ShopifyPage) => {
    setItems((prev) => {
      const seen = new Set(prev.map((p) => p.id));
      return [...prev, ...page.products.filter((p) => !seen.has(p.id))];
    });
    setCursor(page.cursor);
    setHasNext(page.hasNext && !!page.cursor);
  };

  const fetchPage = (c: string | null) =>
    fetch(url(block, country, c)).then(async (r) => {
      const body = await r.json();
      if (!r.ok) throw new Error(body.message ?? "Couldn't load more.");
      return body as ShopifyPage;
    });

  useEffect(() => {
    let live = true;
    fetchPage(null)
      .then((p) => live && add(p))
      .catch((e) => live && setError(e instanceof Error ? e.message : "Couldn't load."))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [block.id]);

  const more = () => {
    setLoading(true);
    fetchPage(cursor)
      .then(add)
      .catch((e) => setError(e instanceof Error ? e.message : "Couldn't load more."))
      .finally(() => setLoading(false));
  };

  const visible = items.filter((p) => !hidden.has(p.id));
  return (
    <div className="p-5">
      {block.why && <p className="mb-4 text-sm text-ink-soft">{block.why}</p>}
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
        {visible.map((p, i) => (
          <FindsCard key={p.id} p={p} index={i} wide />
        ))}
        {loading && Array.from({ length: 8 }, (_, i) => <CardSkeleton key={`s${i}`} wide />)}
      </div>
      {!loading && !visible.length && !error && <p className="py-10 text-center text-ink-soft">Nothing more for this search.</p>}
      <div className="mt-8 flex flex-col items-center gap-2">
        {error && <p className="text-sm text-warn">{error}</p>}
        {hasNext && !loading && (
          <button onClick={more} className="rounded-full border border-line bg-paper px-5 py-2 text-sm hover:bg-sand">
            Load more
          </button>
        )}
        {loading && items.length > 0 && <Loader2 size={18} className="animate-spin text-accent" />}
      </div>
    </div>
  );
}
