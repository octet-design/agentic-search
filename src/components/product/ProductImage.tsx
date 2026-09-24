"use client";

import { Shirt } from "lucide-react";
import { useState } from "react";

/** Plain <img> (image hosts are many and unknown), no referrer, graceful placeholder. */
export function ProductImage({ src, alt, className = "" }: { src: string | null; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className={`flex items-center justify-center bg-sand text-ink-faint ${className}`} aria-label={alt}>
        <Shirt size={32} strokeWidth={1.2} />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
    />
  );
}
