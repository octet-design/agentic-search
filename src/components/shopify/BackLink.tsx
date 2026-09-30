"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

/** Back to wherever the shopper came from (a Genuine Finds chat or Shopify search); search if opened directly. */
export function BackLink() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => (window.history.length > 1 ? router.back() : router.push("/shopify"))}
      className="inline-flex items-center gap-1 text-sm text-ink-soft hover:text-ink"
    >
      <ArrowLeft size={14} /> Back
    </button>
  );
}
