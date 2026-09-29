import type { Metadata } from "next";
import { ShopifyResults } from "@/components/shopify/ShopifyResults";
import { ShopifySearchBox } from "@/components/shopify/ShopifySearchBox";
import { searchCatalog, ShopifyError } from "@/lib/shopify/client";
import type { ShopifyPage } from "@/lib/shopify/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Shopify search" };

const EXAMPLES = ["linen shirt", "running shoes", "leather wallet", "ceramic coffee mug"];

/** Standalone Shopify Global Catalog search. Shares nothing with Drape's search/chat beyond the header. */
export default async function ShopifySearchPage({ searchParams }: PageProps<"/shopify">) {
  const raw = (await searchParams).q;
  const q = (typeof raw === "string" ? raw : "").trim().slice(0, 200);

  let page: ShopifyPage | null = null;
  let error: string | null = null;
  if (q) {
    try {
      page = await searchCatalog(q);
    } catch (err) {
      console.error("[shopify] search failed:", err);
      error = err instanceof ShopifyError ? err.message : "Something went wrong. Please try again.";
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-8 md:px-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-3xl tracking-tight">Shopify search</h1>
        <p className="mb-5 mt-1 text-sm text-ink-soft">Products from stores across Shopify. You buy on the store&rsquo;s own site.</p>
        <ShopifySearchBox defaultValue={q} />
        {!q && (
          <div className="mt-4 flex flex-wrap gap-2">
            {EXAMPLES.map((e) => (
              <a key={e} href={`/shopify?q=${encodeURIComponent(e)}`} className="rounded-full border border-line bg-paper px-3 py-1 text-sm text-ink-soft hover:bg-sand hover:text-ink">
                {e}
              </a>
            ))}
          </div>
        )}
      </div>
      {page && (
        <div className="mt-10">
          <ShopifyResults key={q} query={q} initial={page} />
        </div>
      )}
      {error && <p className="py-16 text-center text-warn">Shopify search failed: {error}</p>}
    </div>
  );
}
