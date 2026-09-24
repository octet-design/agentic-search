"use client";

import { useRouter } from "next/navigation";
import type { ProductCard } from "@/lib/agent/types";
import { ProductDetails } from "./ProductDetails";

export function ProductPageClient({ p }: { p: ProductCard }) {
  const router = useRouter();
  return <ProductDetails p={p} onOpen={(x) => router.push(`/p/${encodeURIComponent(x.id)}`)} />;
}
