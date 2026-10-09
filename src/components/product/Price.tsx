import type { ProductCard } from "@/lib/agent/types";
import { cn, inr } from "@/lib/format";

/** Selling price, plus the original price struck through and "% off" when the store lists a discount. */
export function Price({ p, className }: { p: Pick<ProductCard, "price" | "listPrice" | "priceApprox">; className?: string }) {
  const off = p.listPrice && p.listPrice > p.price ? Math.round((1 - p.price / p.listPrice) * 100) : 0;
  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-x-1.5", className)} title={p.priceApprox ? "Converted from the store's currency" : undefined}>
      <span className="font-semibold">
        {p.priceApprox ? "≈ " : ""}
        {inr(p.price)}
      </span>
      {off >= 1 && (
        <>
          <s className="text-[0.85em] font-normal text-ink-faint">{inr(p.listPrice!)}</s>
          <span className="text-[0.85em] font-medium text-ok">{off}% off</span>
        </>
      )}
    </span>
  );
}
