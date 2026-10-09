"use client";

import { ShoppingBag, Star } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { money, percentOff, shopifyProductHref } from "@/lib/shopify/format";
import type { ShopifyCard as Card } from "@/lib/shopify/types";

export function ShopifyImage({ src, alt, className = "" }: { src: string | null; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className={`flex items-center justify-center bg-sand text-ink-faint ${className}`} aria-label={alt}>
        <ShoppingBag size={32} strokeWidth={1.2} />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setFailed(true)} className={`object-cover ${className}`} />
  );
}

export function ShopifyCard({ p }: { p: Card }) {
  return (
    <article className="group flex flex-col">
      <Link
        href={shopifyProductHref(p.id)}
        className="relative block aspect-[3/4] w-full overflow-hidden rounded-xl bg-sand transition-transform duration-200 group-hover:-translate-y-0.5"
      >
        <ShopifyImage src={p.image} alt={p.title} className="h-full w-full" />
      </Link>
      <div className="mt-2 flex flex-1 flex-col gap-1 px-0.5">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-xs font-medium uppercase tracking-wide text-ink-soft">{p.seller ?? "Shopify store"}</span>
          {p.price && (
            <span className="shrink-0 text-sm font-semibold">
              {p.priceFrom && <span className="font-normal text-ink-soft">from </span>}
              {money(p.price)}
              {percentOff(p.price, p.listPrice) && (
                <>
                  {" "}
                  <s className="font-normal text-ink-faint">{money(p.listPrice!)}</s> <span className="font-medium text-ok">{percentOff(p.price, p.listPrice)}% off</span>
                </>
              )}
            </span>
          )}
        </div>
        <Link href={shopifyProductHref(p.id)} className="line-clamp-2 text-sm leading-snug hover:underline">
          {p.title}
        </Link>
        {p.rating && (
          <span className="inline-flex items-center gap-1 text-xs text-ink-soft">
            <Star size={12} className="fill-current text-accent" /> {p.rating.value.toFixed(1)}
            {p.rating.count != null && <span className="text-ink-faint">({p.rating.count})</span>}
          </span>
        )}
      </div>
    </article>
  );
}

export function ShopifySkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <div className="skeleton aspect-[3/4] w-full rounded-xl" />
      <div className="skeleton h-3 w-1/2 rounded" />
      <div className="skeleton h-3 w-5/6 rounded" />
    </div>
  );
}
