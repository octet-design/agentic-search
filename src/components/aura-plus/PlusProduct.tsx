"use client";

import { useEffect, useState } from "react";
import { ProductCard as Card } from "@/components/product/ProductCard";
import { ProductDetails } from "@/components/product/ProductDetails";
import type { ProductCard } from "@/lib/agent/types";

/** "More from {brand}": other in-stock products from the same brand in the Typesense catalog. */
function MoreFromBrand({ p, onOpen }: { p: ProductCard; onOpen: (p: ProductCard) => void }) {
  const [data, setData] = useState<{ id: string; products: ProductCard[] } | null>(null);
  useEffect(() => {
    let live = true;
    fetch(`/api/aura-plus/brand?id=${encodeURIComponent(p.id)}`)
      .then((r) => (r.ok ? r.json() : { products: [] }))
      .then((j: { products: ProductCard[] }) => live && setData({ id: p.id, products: j.products ?? [] }))
      .catch(() => live && setData({ id: p.id, products: [] }));
    return () => {
      live = false;
    };
  }, [p.id]);
  const products = data?.id === p.id ? data.products : null;
  if (products && !products.length) return null;
  return (
    <div className="px-5 pb-6">
      <h3 className="mb-3 font-display text-lg">More from {p.brand}</h3>
      <div className="no-scrollbar -mx-5 flex snap-x gap-3 overflow-x-auto px-5 pb-2">
        {products === null
          ? Array.from({ length: 4 }, (_, i) => <div key={i} className="skeleton aspect-[3/4] w-36 shrink-0 rounded-xl" />)
          : products.map((x, i) => <Card key={x.id} p={x} index={i} compact onOpen={onOpen} />)}
      </div>
    </div>
  );
}

/**
 * Aura++ product view: Drape's details (shop link, save, Style it, attributes, sizes, similar) plus
 * "More from this brand", with ask / more-like actions pinned at the bottom.
 */
export function PlusProduct({ p, onOpen, onAsk, onMoreLike }: { p: ProductCard; onOpen: (p: ProductCard) => void; onAsk?: (p: ProductCard) => void; onMoreLike?: (p: ProductCard) => void }) {
  return (
    <div>
      <ProductDetails p={p} onOpen={onOpen} />
      <MoreFromBrand p={p} onOpen={onOpen} />
      {(onAsk || onMoreLike) && (
        <div className="sticky bottom-0 flex gap-2 border-t border-line bg-paper px-5 py-3">
          {onAsk && (
            <button onClick={() => onAsk(p)} className="flex-1 border border-line px-3 py-2 text-sm hover:border-ink">
              Ask about this
            </button>
          )}
          {onMoreLike && (
            <button onClick={() => onMoreLike(p)} className="flex-1 bg-ink px-3 py-2 text-sm text-canvas">
              More like this
            </button>
          )}
        </div>
      )}
    </div>
  );
}
