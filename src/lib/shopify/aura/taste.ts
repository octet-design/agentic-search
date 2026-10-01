"use client";

/**
 * What the shopper does in Aura (searches, opened products, brands), in this browser only. It seeds the
 * personalised "For you" feed; there is no onboarding, so the feed starts curated and adapts as they browse.
 */
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { FeedSeeds } from "../feed";
import type { ShopifyCard } from "../types";

type Seen = { id: string; title: string; at: number };
type Brand = { id: string; name: string; n: number };

type Taste = {
  queries: { q: string; at: number }[];
  opened: Seen[];
  brands: Brand[];
};

export const useAuraTaste = create<Taste>()(
  persist((): Taste => ({ queries: [], opened: [], brands: [] }), { name: "aura-taste", storage: createJSONStorage(() => localStorage) }),
);

export type AuraEvent =
  | { type: "search"; query: string }
  | { type: "open"; product: ShopifyCard }
  | { type: "save"; product: ShopifyCard }
  | { type: "view_results" }
  | { type: "filters_apply"; message: string }
  | { type: "buy_click"; productId: string }
  | { type: "feed_page"; page: number };

/** Records a behaviour signal (feed seeds) and logs the event for the demo readout. */
export function track(e: AuraEvent) {
  if (process.env.NODE_ENV !== "test") console.info("[aura]", e.type, e);
  const now = Date.now();
  const s = useAuraTaste.getState();
  const brandOf = (p: ShopifyCard): Brand[] => {
    if (!p.sellerId || !p.seller) return s.brands;
    const hit = s.brands.find((b) => b.id === p.sellerId);
    const rest = s.brands.filter((b) => b.id !== p.sellerId);
    return [{ id: p.sellerId, name: p.seller, n: (hit?.n ?? 0) + 1 }, ...rest].slice(0, 12);
  };
  if (e.type === "search") {
    // Feed seeds should be real searches, not product questions or Smart Filter strings.
    const q = e.query.trim();
    if (q.length < 3 || q.length > 80 || /\]\(#\d+\)|^(about|compare|more like this|style it|drop)\b/i.test(q) || q.includes(",")) return;
    useAuraTaste.setState({ queries: [{ q, at: now }, ...s.queries.filter((x) => x.q.toLowerCase() !== q.toLowerCase())].slice(0, 10) });
  } else if (e.type === "open" || e.type === "save") {
    const p = e.product;
    useAuraTaste.setState({
      opened: [{ id: p.id, title: p.title, at: now }, ...s.opened.filter((x) => x.id !== p.id)].slice(0, 20),
      brands: brandOf(p),
    });
  }
}

/** The feed's seeds: saved first (strongest), then recently opened; recent searches; most-liked brands. */
export function feedSeeds(saved: ShopifyCard[]): FeedSeeds {
  const t = useAuraTaste.getState();
  const products = [...saved.map((p) => ({ id: p.id, title: p.title })), ...t.opened.map((o) => ({ id: o.id, title: o.title }))]
    .filter((p, i, all) => all.findIndex((x) => x.id === p.id) === i)
    .slice(0, 3);
  return {
    products,
    queries: t.queries.slice(0, 3).map((x) => x.q),
    brands: [...t.brands].sort((a, b) => b.n - a.n).filter((b) => b.n >= 2).slice(0, 2).map(({ id, name }) => ({ id, name })),
  };
}
