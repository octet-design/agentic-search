import { ArrowLeft, ExternalLink, ShoppingBag, Star } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShopifyImage } from "@/components/shopify/ShopifyCard";
import { getProduct, isShortId, ShopifyError } from "@/lib/shopify/client";
import { money, shopifyProductHref } from "@/lib/shopify/format";
import type { Product } from "@/lib/shopify/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Shopify product" };

const POLICY_LABELS: Record<string, string> = {
  shipping_policy: "Shipping",
  refund_policy: "Returns",
  terms_of_service: "Terms",
  privacy_policy: "Privacy",
};

/** Option picks live in the URL (?Size=M&Color=White); Shopify resolves them to a variant. */
export default async function ShopifyProductPage({ params, searchParams }: PageProps<"/shopify/p/[id]">) {
  const { id } = await params;
  const shortId = decodeURIComponent(id);
  if (!isShortId(shortId)) notFound();

  const selected = Object.entries(await searchParams)
    .filter((e): e is [string, string] => typeof e[1] === "string" && e[1] !== "")
    .slice(0, 10)
    .map(([name, label]) => ({ name, label }));

  let product: Product | null;
  try {
    product = await getProduct(shortId, selected);
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

  const variant = product.variants[0];
  const chosen = product.selected.length ? product.selected : variant?.options ?? [];
  const images = [...(variant?.media ?? []), ...product.media].filter((m, i, all) => all.findIndex((x) => x.url === m.url) === i);
  const price = variant?.price ?? product.price_range?.min ?? null;
  const available = variant?.availability?.available !== false;
  const buyUrl = variant?.checkout_url ?? variant?.url ?? null;
  const seller = variant?.seller;
  const description = variant?.description?.plain ?? product.description?.plain;
  const meta = product.metadata;

  const hrefWith = (name: string, label: string) =>
    shopifyProductHref(shortId, [...chosen.filter((c) => c.name !== name), { name, label }]);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-6 md:px-8">
      <BackLink />
      <div className="mt-4 grid gap-8 md:grid-cols-2">
        <div className="flex flex-col gap-3">
          <ShopifyImage src={images[0]?.url ?? null} alt={images[0]?.alt_text ?? product.title} className="aspect-[3/4] w-full rounded-2xl" />
          {images.length > 1 && (
            <div className="no-scrollbar flex gap-2 overflow-x-auto">
              {images.slice(1, 8).map((m) => (
                <ShopifyImage key={m.url} src={m.url} alt={m.alt_text ?? product.title} className="aspect-[3/4] w-20 shrink-0 rounded-lg" />
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <div>
            {seller?.name && (
              <a href={seller.url ?? undefined} target="_blank" rel="noopener noreferrer" className="text-xs font-medium uppercase tracking-wide text-ink-soft hover:underline">
                {seller.name}
              </a>
            )}
            <h1 className="mt-1 font-display text-3xl leading-tight tracking-tight">{product.title}</h1>
            <div className="mt-2 flex items-center gap-3">
              {price && <span className="text-xl font-semibold">{money(price)}</span>}
              {product.rating && (
                <span className="inline-flex items-center gap-1 text-sm text-ink-soft">
                  <Star size={14} className="fill-current text-accent" /> {product.rating.value.toFixed(1)}
                  {product.rating.count != null && <span className="text-ink-faint">({product.rating.count} reviews)</span>}
                </span>
              )}
            </div>
          </div>

          {product.options.map((opt) => {
            const current = chosen.find((c) => c.name === opt.name)?.label;
            return (
              <div key={opt.name}>
                <div className="mb-2 text-sm">
                  {opt.name}: <span className="font-medium">{current ?? "—"}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {opt.values.map((v) => {
                    const active = v.label === current;
                    const out = v.available === false;
                    return (
                      <Link
                        key={v.label}
                        href={hrefWith(opt.name, v.label)}
                        scroll={false}
                        replace
                        aria-current={active ? "true" : undefined}
                        className={`rounded-full border px-3 py-1 text-sm ${active ? "border-ink bg-ink text-canvas" : "border-line bg-paper hover:bg-sand"} ${out ? "line-through opacity-50" : ""}`}
                      >
                        {v.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <div className="flex flex-col gap-2">
            {buyUrl && available ? (
              <a
                href={buyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-white hover:bg-accent/90"
              >
                <ShoppingBag size={16} /> Buy on {seller?.name ?? "store"}
              </a>
            ) : (
              <span className="rounded-full bg-sand px-6 py-3 text-center text-sm text-ink-soft">{available ? "Not available to buy here" : "Out of stock in this option"}</span>
            )}
            {variant?.url && (
              <a href={variant.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-1.5 text-sm text-ink-soft hover:text-ink">
                View on store <ExternalLink size={13} />
              </a>
            )}
            <p className="text-center text-xs text-ink-faint">Checkout happens on the seller&rsquo;s site.</p>
          </div>

          {!!meta?.top_features.length && (
            <Section title="Highlights">
              <ul className="list-disc space-y-1 pl-5">
                {meta.top_features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </Section>
          )}
          {description && (
            <Section title="Description">
              <p className="whitespace-pre-line">{description}</p>
            </Section>
          )}
          {!!meta?.tech_specs.length && (
            <Section title="Details">
              <ul className="space-y-1">
                {meta.tech_specs.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </Section>
          )}
          {!!seller?.links.length && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-soft">
              {seller.links
                .filter((l) => POLICY_LABELS[l.type])
                .map((l) => (
                  <a key={l.type} href={l.url} target="_blank" rel="noopener noreferrer" className="hover:text-ink hover:underline">
                    {POLICY_LABELS[l.type]}
                  </a>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line pt-4 text-sm leading-relaxed text-ink-soft">
      <h2 className="mb-2 font-medium text-ink">{title}</h2>
      {children}
    </section>
  );
}

function BackLink() {
  return (
    <Link href="/shopify" className="inline-flex items-center gap-1 text-sm text-ink-soft hover:text-ink">
      <ArrowLeft size={14} /> Shopify search
    </Link>
  );
}
