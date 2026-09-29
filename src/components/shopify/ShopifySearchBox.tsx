import { Search } from "lucide-react";

/** Plain GET form to /shopify?q=…, so results are server-rendered and the URL is shareable. */
export function ShopifySearchBox({ defaultValue = "" }: { defaultValue?: string }) {
  return (
    <form action="/shopify" method="get" role="search" className="flex items-center gap-2 rounded-full border border-line bg-paper py-1.5 pl-4 pr-1.5 shadow-sm focus-within:border-ink-faint">
      <Search size={18} className="shrink-0 text-ink-faint" />
      <input
        name="q"
        type="search"
        defaultValue={defaultValue}
        placeholder="Search products across Shopify stores"
        aria-label="Search Shopify products"
        maxLength={200}
        required
        className="min-w-0 flex-1 bg-transparent py-1.5 text-base outline-none placeholder:text-ink-faint"
      />
      <button type="submit" className="rounded-full bg-ink px-4 py-2 text-sm text-canvas hover:bg-ink/90">
        Search
      </button>
    </form>
  );
}
