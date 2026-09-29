import { ShopifySkeleton } from "@/components/shopify/ShopifyCard";
import { GRID } from "@/components/shopify/grid";

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-8 md:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="skeleton h-9 w-56 rounded" />
        <div className="skeleton mt-6 h-12 w-full rounded-full" />
      </div>
      <div className={`mt-10 ${GRID}`}>
        {Array.from({ length: 8 }, (_, i) => (
          <ShopifySkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
