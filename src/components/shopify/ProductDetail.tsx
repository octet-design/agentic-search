"use client";

import { ChevronLeft, ChevronRight, ExternalLink, Loader2, ShieldCheck, ShoppingBag, Star } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getCountry, type Country } from "@/lib/shopify/countries";
import { money, shopifyProductHref } from "@/lib/shopify/format";
import type { ShopifyCard, ShopifyPage } from "@/lib/shopify/types";
import { cardFromView, type ProductView } from "@/lib/shopify/view";
import { SaveButton } from "./aura/ProductTile";
import { ShopifyImage } from "./ShopifyCard";
import { StyleIt } from "./StyleIt";

type Selected = { name: string; label: string }[];

async function fetchView(id: string, selected: Selected, country: Country | null): Promise<ProductView> {
  const qs = new URLSearchParams(selected.map((s) => [s.name, s.label]));
  if (country) qs.set("country", country.code);
  const res = await fetch(`/api/shopify/product/${encodeURIComponent(id)}?${qs}`);
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error((body as { message?: string } | null)?.message ?? "Couldn't load this product.");
  return body as ProductView;
}

/** All product photos: big image with prev/next (buttons, swipe, arrow keys), counter and thumbnails. */
function Gallery({ images, title, compact }: { images: ProductView["images"]; title: string; compact: boolean }) {
  const [i, setI] = useState(0);
  const touchX = useRef<number | null>(null);
  const thumbs = useRef<HTMLDivElement>(null);
  const n = images.length;
  const go = (d: number) => setI((x) => (x + d + n) % n);

  useEffect(() => {
    thumbs.current?.children[i]?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [i]);

  if (!n) return <ShopifyImage src={null} alt={title} className={`${compact ? "aspect-[4/5]" : "aspect-[3/4]"} w-full rounded-2xl`} />;
  const cur = images[Math.min(i, n - 1)];

  return (
    <div className="flex flex-col gap-3">
      <div
        className={`group relative overflow-hidden rounded-2xl bg-sand ${compact ? "aspect-[4/5]" : "aspect-[3/4]"}`}
        tabIndex={0}
        role="region"
        aria-roledescription="carousel"
        aria-label={`${title}: photo ${i + 1} of ${n}`}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") go(-1);
          if (e.key === "ArrowRight") go(1);
        }}
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX.current == null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
          touchX.current = null;
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img key={cur.url} src={cur.url} alt={cur.alt} referrerPolicy="no-referrer" className="h-full w-full object-contain" />
        {n > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous photo"
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-ink shadow-md backdrop-blur transition hover:bg-white md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next photo"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-ink shadow-md backdrop-blur transition hover:bg-white md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
            >
              <ChevronRight size={20} />
            </button>
            <span className="absolute bottom-2 right-2 rounded-full bg-ink/70 px-2 py-0.5 text-xs text-canvas">
              {i + 1} / {n}
            </span>
          </>
        )}
      </div>
      {n > 1 && (
        <div ref={thumbs} className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {images.map((m, k) => (
            <button
              key={m.url}
              type="button"
              onClick={() => setI(k)}
              aria-label={`Photo ${k + 1}`}
              aria-current={k === i}
              className={`aspect-square w-16 shrink-0 overflow-hidden rounded-lg border-2 bg-sand ${k === i ? "border-ink" : "border-transparent opacity-70 hover:opacity-100"}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.url} alt="" loading="lazy" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line pt-4 text-sm leading-relaxed text-ink-soft">
      <h3 className="mb-2 font-medium text-ink">{title}</h3>
      {children}
    </section>
  );
}

function Description({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const long = text.length > 420;
  return (
    <>
      <p className="whitespace-pre-line">{open || !long ? text : `${text.slice(0, 400).trimEnd()}…`}</p>
      {long && (
        <button type="button" onClick={() => setOpen((o) => !o)} className="mt-1 text-sm font-medium text-ink underline underline-offset-2">
          {open ? "Show less" : "Read more"}
        </button>
      )}
    </>
  );
}

/** A horizontal rail of products from the search API (similar items, more from this brand). */
function ProductRail({ title, params, country, local, onOpen }: { title: string; params: Record<string, string>; country: Country; local?: boolean; onOpen?: (p: ShopifyCard) => void }) {
  const [items, setItems] = useState<ShopifyCard[] | null>(null);
  const qs = new URLSearchParams({ ...params, country: country.code, ...(local ? { local: "1" } : {}) }).toString();
  useEffect(() => {
    let live = true;
    fetch(`/api/shopify/search?${qs}`)
      .then((r) => (r.ok ? r.json() : { products: [] }))
      .then((page: ShopifyPage) => live && setItems(page.products.slice(0, 12)))
      .catch(() => live && setItems([]));
    return () => {
      live = false;
    };
  }, [qs]);

  if (items && !items.length) return null;
  return (
    <section className="border-t border-line pt-4">
      <h3 className="mb-3 text-sm font-medium">{title}</h3>
      <div className="no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
        {(items ?? Array.from({ length: 4 }, () => null)).map((p, i) =>
          p ? (
            <SimilarCard key={p.id} p={p} country={country} onOpen={onOpen} />
          ) : (
            <div key={i} className="w-28 shrink-0 space-y-2">
              <div className="skeleton aspect-[3/4] w-full rounded-lg" />
              <div className="skeleton h-3 w-3/4 rounded" />
            </div>
          ),
        )}
      </div>
    </section>
  );
}

function SimilarCard({ p, country, onOpen }: { p: ShopifyCard; country: Country; onOpen?: (p: ShopifyCard) => void }) {
  const body = (
    <>
      <ShopifyImage src={p.image} alt={p.title} className="aspect-[3/4] w-full rounded-lg" />
      <span className="mt-1.5 line-clamp-2 text-xs leading-snug">{p.title}</span>
      {p.price && <span className="text-xs font-semibold">{money(p.price, country.locale)}</span>}
    </>
  );
  const cls = "flex w-28 shrink-0 flex-col text-left hover:opacity-90";
  return onOpen ? (
    <button type="button" onClick={() => onOpen(p)} className={cls}>
      {body}
    </button>
  ) : (
    <Link href={shopifyProductHref(p.id, [], country.code)} className={cls}>
      {body}
    </Link>
  );
}

/**
 * Full product detail: gallery, size/colour pickers (live price, stock and checkout for the picked variant),
 * Buy now, the store's website, highlights, description, specs and policies.
 * Used on /shopify/p/<id> ("page", keeps the URL in sync) and in the Genuine Finds drawer ("sheet").
 */
export function ProductDetail({
  id,
  country,
  initial = null,
  preview,
  layout,
  onOpenSimilar,
  renderSave,
  localSellers,
}: {
  id: string;
  country: Country | null;
  initial?: ProductView | null;
  /** Search-card data shown while the full product loads. */
  preview?: ShopifyCard;
  layout: "page" | "sheet";
  /** Replaces the default heart (e.g. Typesense search saves into Drape's shared saved list). */
  renderSave?: (card: ShopifyCard) => React.ReactNode;
  /** Sheet: open a similar / Style it / same-brand product in place (the page links to it instead). */
  onOpenSimilar?: (p: ShopifyCard) => void;
  /** Rails show only products shipped from the buyer's country (Blend search). */
  localSellers?: boolean;
}) {
  const [view, setView] = useState<ProductView | null>(initial);
  const [loading, setLoading] = useState(!initial);
  const [error, setError] = useState<string | null>(null);
  const latest = useRef(0);
  const fmt = (m: NonNullable<ProductView["price"]>) => money(m, country?.locale);

  const load = async (selected: Selected) => {
    const req = ++latest.current;
    setLoading(true);
    setError(null);
    try {
      const next = await fetchView(id, selected, country);
      if (req !== latest.current) return;
      setView(next);
      if (layout === "page") window.history.replaceState(null, "", shopifyProductHref(id, next.selected, country?.code));
    } catch (e) {
      if (req === latest.current) setError(e instanceof Error ? e.message : "Couldn't load this product.");
    } finally {
      if (req === latest.current) setLoading(false);
    }
  };

  // First load for the drawer (the page passes `initial`). `loading` already starts true; option picks call load().
  useEffect(() => {
    if (initial) return;
    const req = ++latest.current;
    fetchView(id, [], country)
      .then((next) => req === latest.current && setView(next))
      .catch((e) => req === latest.current && setError(e instanceof Error ? e.message : "Couldn't load this product."))
      .finally(() => req === latest.current && setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const pick = (name: string, label: string) => {
    if (!view) return;
    void load([...view.selected.filter((s) => s.name !== name), { name, label }]);
  };

  const sheet = layout === "sheet";
  const title = view?.title ?? preview?.title ?? "";
  const sellerName = view?.seller.name ?? preview?.seller ?? null;
  const images = view?.images ?? (preview?.image ? [{ url: preview.image, alt: preview.title }] : []);
  const price = view?.price ?? preview?.price ?? null;
  const rating = view?.rating ?? preview?.rating ?? null;
  const storeUrl = view?.storeUrl ?? preview?.url ?? null;
  const shopIn = country ?? getCountry(null);
  const card = view ? cardFromView(view) : preview;

  return (
    <div className={sheet ? "flex flex-col gap-5 p-5" : "grid gap-8 md:grid-cols-2"}>
      <Gallery key={images[0]?.url ?? "none"} images={images} title={title} compact={sheet} />

      <div className="flex flex-col gap-5">
        <div>
          {sellerName &&
            (view?.seller.url ? (
              <a href={view.seller.url} target="_blank" rel="noopener noreferrer" className="text-xs font-medium uppercase tracking-wide text-ink-soft hover:underline">
                {sellerName}
              </a>
            ) : (
              <span className="text-xs font-medium uppercase tracking-wide text-ink-soft">{sellerName}</span>
            ))}
          <div className="mt-1 flex items-start justify-between gap-3">
            <h1 className={`font-display leading-tight tracking-tight ${sheet ? "text-2xl" : "text-3xl"}`}>{title}</h1>
            {card && (renderSave ? renderSave(card) : <SaveButton p={card} country={shopIn} className="shrink-0 border border-line" />)}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            {price && <span className="text-xl font-semibold">{fmt(price)}</span>}
            {rating && (
              <span className="inline-flex items-center gap-1 text-sm text-ink-soft">
                <Star size={14} className="fill-current text-accent" /> {rating.value.toFixed(1)}
                {rating.count != null && <span className="text-ink-faint">({rating.count} reviews)</span>}
              </span>
            )}
            {view && (
              <span className={`text-sm ${view.available ? "text-ok" : "text-warn"}`}>{view.available ? "In stock" : "Sold out in this option"}</span>
            )}
            {loading && <Loader2 size={16} className="animate-spin text-accent" aria-label="Updating" />}
          </div>
        </div>

        {view?.options.map((opt) => {
          const current = view.selected.find((s) => s.name === opt.name)?.label;
          return (
            <div key={opt.name}>
              <div className="mb-2 text-sm">
                {opt.name}: <span className="font-medium">{current ?? "Choose"}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {opt.values.map((v) => {
                  const active = v.label === current;
                  return (
                    <button
                      key={v.label}
                      type="button"
                      disabled={loading && !active}
                      onClick={() => !active && pick(opt.name, v.label)}
                      aria-pressed={active}
                      title={v.available ? undefined : "Sold out with your other choices"}
                      className={`rounded-full border px-3 py-1 text-sm transition ${active ? "border-ink bg-ink text-canvas" : "border-line bg-paper hover:border-ink"} ${v.available ? "" : "text-ink-faint line-through"}`}
                    >
                      {v.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {error && <p className="rounded-xl bg-warn/5 px-3 py-2 text-sm text-warn">{error}</p>}

        <div className="flex flex-col gap-2">
          {view ? (
            view.buyUrl && view.available ? (
              <a
                href={view.buyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-white hover:bg-accent/90 ${loading ? "pointer-events-none opacity-60" : ""}`}
              >
                <ShoppingBag size={16} /> Buy now on {sellerName ?? "the store"}
              </a>
            ) : (
              <span className="rounded-full bg-sand px-6 py-3 text-center text-sm text-ink-soft">{view.available ? "Not available to buy here" : "Sold out in this option. Try another."}</span>
            )
          ) : (
            <div className="skeleton h-11 w-full rounded-full" />
          )}
          {storeUrl && (
            <a
              href={storeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-line bg-paper px-6 py-2.5 text-sm hover:border-ink"
            >
              Visit {sellerName ?? "store"} website <ExternalLink size={14} />
            </a>
          )}
          <p className="flex items-start gap-2 rounded-xl bg-sand/60 p-3 text-xs leading-relaxed text-ink-soft">
            <ShieldCheck size={14} className="mt-0.5 shrink-0 text-ok" />
            You pay on {sellerName ?? "the store"}&rsquo;s own checkout. We never see your payment details. Prices and stock are live and can change.
          </p>
        </div>

        {!view && loading && (
          <div className="space-y-2">
            <div className="skeleton h-3 w-3/4 rounded" />
            <div className="skeleton h-3 w-5/6 rounded" />
            <div className="skeleton h-3 w-2/3 rounded" />
          </div>
        )}
        <StyleIt id={id} country={shopIn} onOpen={onOpenSimilar} />
        {view && <ProductRail title="Similar items" params={{ like: view.id, exclude: view.id }} country={shopIn} local={localSellers} onOpen={onOpenSimilar} />}
        {view?.seller.id && (
          <ProductRail title={`More from ${view.seller.name ?? "this brand"}`} params={{ shop: view.seller.id, exclude: view.id }} country={shopIn} local={localSellers} onOpen={onOpenSimilar} />
        )}
        {!!view?.highlights.length && (
          <Section title="Highlights">
            <ul className="list-disc space-y-1 pl-5">
              {view.highlights.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </Section>
        )}
        {view?.description && (
          <Section title="Description">
            <Description text={view.description} />
          </Section>
        )}
        {!!view?.specs.length && (
          <Section title="Details">
            <ul className="space-y-1">
              {view.specs.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </Section>
        )}
        {!!view?.seller.policies.length && (
          <Section title="Store policies">
            <div className="flex flex-wrap gap-2">
              {view.seller.policies.map((l) => (
                <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer" className="rounded-full border border-line px-3 py-1 text-xs hover:border-ink hover:text-ink">
                  {l.label}
                </a>
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}
