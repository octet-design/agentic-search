import type { Metadata } from "next";
import { ShopifyResults } from "@/components/shopify/ShopifyResults";
import { ShopifySearchBox } from "@/components/shopify/ShopifySearchBox";
import { ShopifyError } from "@/lib/shopify/client";
import { getCountry } from "@/lib/shopify/countries";
import { getShopifyEnv } from "@/lib/shopify/env";
import { isNonFashionQuery, searchFashion } from "@/lib/shopify/search";
import type { ShopifyPage } from "@/lib/shopify/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Shopify fashion search" };

const EXAMPLES = ["linen shirt", "running shoes", "leather wallet", "cotton kurta", "block heel sandals"];

/** Standalone fashion search over Shopify's Global Catalog. Shares nothing with Drape's search/chat beyond the header. */
export default async function ShopifySearchPage({ searchParams }: PageProps<"/shopify">) {
  const raw = (await searchParams).q;
  const q = (typeof raw === "string" ? raw : "").trim().slice(0, 200);

  let page: ShopifyPage | null = null;
  let error: string | null = null;
  if (q && isNonFashionQuery(q)) {
    error = "This search is fashion only for now: clothing, shoes, bags, jewellery, watches and accessories.";
  } else if (q) {
    try {
      page = await searchFashion({ query: q, min: null, max: null, local: false }, getCountry(getShopifyEnv().SHOPIFY_COUNTRY), { limit: 24 });
    } catch (err) {
      console.error("[shopify] search failed:", err);
      error = `Shopify search failed: ${err instanceof ShopifyError ? err.message : "something went wrong. Please try again."}`;
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-8 md:px-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-3xl tracking-tight">Shopify fashion search</h1>
        <p className="mb-5 mt-1 text-sm text-ink-soft">Clothing, shoes, bags and accessories from stores across Shopify. You buy on the store&rsquo;s own site.</p>
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
      {error && <p className="py-16 text-center text-ink-soft">{error}</p>}
    </div>
  );
}
