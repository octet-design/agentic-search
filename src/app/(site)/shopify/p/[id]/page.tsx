import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BackLink } from "@/components/shopify/BackLink";
import { ProductDetail } from "@/components/shopify/ProductDetail";
import { getProduct, isShortId, ShopifyError } from "@/lib/shopify/client";
import { getCountry, isCountryCode } from "@/lib/shopify/countries";
import { COUNTRY_PARAM } from "@/lib/shopify/format";
import type { Product } from "@/lib/shopify/types";
import { toProductView } from "@/lib/shopify/view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Product details" };

/** Option picks live in the URL (?Size=M&Color=White); Shopify resolves them to a variant. */
export default async function ShopifyProductPage({ params, searchParams }: PageProps<"/shopify/p/[id]">) {
  const { id } = await params;
  const shortId = decodeURIComponent(id);
  if (!isShortId(shortId)) notFound();

  const sp = await searchParams;
  // ?country=XX comes from Genuine Finds chats; without it the env default applies.
  const country = isCountryCode(sp[COUNTRY_PARAM]) ? getCountry(sp[COUNTRY_PARAM] as string) : null;
  const selected = Object.entries(sp)
    .filter((e): e is [string, string] => e[0] !== COUNTRY_PARAM && typeof e[1] === "string" && e[1] !== "")
    .slice(0, 10)
    .map(([name, label]) => ({ name, label }));

  let product: Product | null;
  try {
    product = await getProduct(shortId, selected, { country: country?.code, currency: country?.currency });
  } catch (err) {
    console.error("[shopify] get_product failed:", err);
    const message = err instanceof ShopifyError ? err.message : "Something went wrong. Please try again.";
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-warn">Couldn&rsquo;t load this product: {message}</p>
        <BackLink />
      </div>
    );
  }
  if (!product) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-6 md:px-8">
      <BackLink />
      <div className="mt-4">
        <ProductDetail key={shortId} id={shortId} country={country} initial={toProductView(shortId, product)} layout="page" />
      </div>
    </div>
  );
}
