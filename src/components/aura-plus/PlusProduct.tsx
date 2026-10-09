"use client";

import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { ProductCard as Card } from "@/components/product/ProductCard";
import { ProductDetails } from "@/components/product/ProductDetails";
import { ProductDetail as ShopifyProductDetail } from "@/components/shopify/ProductDetail";
import type { ProductCard } from "@/lib/agent/types";
import { fromShopify, isShopifyId, shopifyIdOf } from "@/lib/blend";
import { getCountry } from "@/lib/shopify/countries";
import type { ShopifyCard } from "@/lib/shopify/types";
import { useSession } from "@/store/session";
import { SourceChip } from "./PlusTile";

const INDIA = getCountry("IN");

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

/** Heart for a Shopify product that saves into Drape's shared list, like every other tile in Typesense search. */
function SharedSave({ card }: { card: ShopifyCard }) {
  const p = fromShopify(card);
  const saved = useSession((s) => s.saved.includes(p.id));
  return (
    <button
      type="button"
      onClick={() => useSession.getState().toggleLike(p)}
      aria-pressed={saved}
      aria-label={saved ? "Remove from saved" : "Save"}
      className={`shrink-0 rounded-full border p-2 transition ${saved ? "border-accent bg-accent text-white" : "border-line hover:bg-sand"}`}
    >
      <Heart size={15} fill={saved ? "currentColor" : "none"} />
    </button>
  );
}

/** A ProductCard from Shopify back into the shape the Shopify product view previews with. */
function shopifyPreview(p: ProductCard): ShopifyCard {
  return {
    id: shopifyIdOf(p.id),
    title: p.title,
    image: p.image,
    price: { amount: Math.round(p.price * 100), currency: "INR" },
    listPrice: p.listPrice ? { amount: Math.round(p.listPrice * 100), currency: "INR" } : null,
    priceFrom: false,
    seller: p.brand,
    sellerId: null,
    rating: null,
    features: [],
    url: p.url || null,
    checkoutUrl: p.checkoutUrl ?? null,
    defaultOptions: null,
  };
}

/**
 * Product view in Typesense search. Catalog products: Drape's details (shop link, save, Style it, attributes,
 * sizes, similar) plus "More from this brand". Shopify products: the Shopify view (photos, variants, Buy now,
 * Style it, similar, more from the brand). Ask / more-like actions are pinned at the bottom for both.
 */
export function PlusProduct({
  p,
  onOpen,
  onAsk,
  onMoreLike,
  showSource = false,
}: {
  p: ProductCard;
  onOpen: (p: ProductCard) => void;
  onAsk?: (p: ProductCard) => void;
  onMoreLike?: (p: ProductCard) => void;
  showSource?: boolean;
}) {
  const shopify = isShopifyId(p.id);
  return (
    <div>
      {showSource && (
        <div className="px-5 pt-4">
          <SourceChip p={p} className="inline-block" />
        </div>
      )}
      {shopify ? (
        <ShopifyProductDetail
          id={shopifyIdOf(p.id)}
          country={INDIA}
          preview={shopifyPreview(p)}
          layout="sheet"
          onOpenSimilar={(c) => onOpen(fromShopify(c))}
          renderSave={(card) => <SharedSave card={card} />}
          anyProduct
        />
      ) : (
        <>
          <ProductDetails p={p} onOpen={onOpen} />
          <MoreFromBrand p={p} onOpen={onOpen} />
        </>
      )}
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
