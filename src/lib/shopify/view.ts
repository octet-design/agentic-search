import type { Product, ShopifyCard } from "./types";

/** Everything the product detail UI shows, for the currently selected variant. Safe to send to the client. */
export type ProductView = {
  id: string;
  title: string;
  images: { url: string; alt: string }[];
  price: { amount: number; currency: string } | null;
  available: boolean;
  /** One-click checkout for the selected variant, else the store product page. */
  buyUrl: string | null;
  storeUrl: string | null;
  seller: { id: string | null; name: string | null; url: string | null; policies: { label: string; url: string }[] };
  rating: { value: number; count: number | null } | null;
  options: { name: string; values: { label: string; available: boolean }[] }[];
  selected: { name: string; label: string }[];
  highlights: string[];
  specs: string[];
  description: string | null;
};

const POLICY_LABELS: Record<string, string> = {
  shipping_policy: "Shipping",
  refund_policy: "Returns & refunds",
  terms_of_service: "Terms",
  privacy_policy: "Privacy",
};

export function toProductView(id: string, p: Product): ProductView {
  const v = p.variants[0];
  // Selected variant's photo first, then the rest of the product's, without repeats.
  const media = [...(v?.media ?? []), ...p.media];
  const images = media
    .filter((m, i) => m.url && media.findIndex((x) => x.url === m.url) === i && (!m.type || m.type === "image"))
    .map((m) => ({ url: m.url, alt: m.alt_text ?? p.title }));
  const seller = v?.seller;
  return {
    id,
    title: p.title,
    images,
    price: v?.price ?? p.price_range?.min ?? null,
    available: v?.availability?.available !== false,
    buyUrl: v?.checkout_url ?? v?.url ?? null,
    storeUrl: v?.url ?? seller?.url ?? null,
    seller: {
      id: seller?.id ?? null,
      name: seller?.name ?? null,
      url: seller?.url ?? null,
      policies: (seller?.links ?? []).filter((l) => POLICY_LABELS[l.type]).map((l) => ({ label: POLICY_LABELS[l.type], url: l.url })),
    },
    rating: p.rating ? { value: p.rating.value, count: p.rating.count ?? null } : null,
    options: p.options
      .filter((o) => !(o.name === "Title" && o.values.length === 1 && o.values[0].label === "Default Title"))
      .map((o) => ({ name: o.name, values: o.values.filter((x) => x.exists !== false).map((x) => ({ label: x.label, available: x.available !== false })) })),
    selected: p.selected.length ? p.selected : (v?.options ?? []),
    highlights: p.metadata?.top_features ?? [],
    specs: p.metadata?.tech_specs ?? [],
    description: v?.description?.plain ?? p.description?.plain ?? null,
  };
}

/** The grid/save card for a product as currently shown (selected variant's price, photo and checkout). */
export function cardFromView(v: ProductView): ShopifyCard {
  return {
    id: v.id,
    title: v.title,
    image: v.images[0]?.url ?? null,
    price: v.price,
    priceFrom: false,
    seller: v.seller.name,
    sellerId: v.seller.id,
    rating: v.rating,
    features: v.highlights.slice(0, 3),
    url: v.storeUrl,
    checkoutUrl: v.buyUrl,
    defaultOptions: v.selected.map((s) => s.label).join(" / ") || null,
  };
}
