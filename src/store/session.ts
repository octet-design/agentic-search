"use client";

/** Anonymous session state (brief §8.1): profile, signals, saved, compare. localStorage only. */
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { ProductCard, ProductLite } from "@/lib/agent/types";
import type { Interaction, InteractionKind } from "@/lib/taste";

export type AudienceKey = "women" | "men" | "girls" | "boys";
export type DislikeReason = "price" | "style" | "color" | "fabric" | "other";

export type Profile = {
  audiences: AudienceKey[];
  sizes: { top?: string; bottom?: string; footwear?: string };
  budget: { min?: number; max?: number } | null;
  styles: string[];
  avoidColors: string[];
  avoidFabrics: string[];
  onlyMySize: boolean;
  onboarded: boolean;
};

export type Signals = {
  liked: ProductLite[];
  disliked: { p: ProductLite; reason: DislikeReason }[];
  clicked: ProductLite[];
  searches: string[];
  /** Weighted, time-decayed engagement: quick views, dwell, outbound clicks, compare, more-like. */
  interactions: Interaction[];
};

export type MemoryFact = { id: string; text: string; at: number };

type State = {
  profile: Profile;
  /** Durable facts the user told Drape in chat ("wears size M", "avoids polyester"). Editable. */
  memory: MemoryFact[];
  signals: Signals;
  saved: string[];
  compare: string[];
  /** Full cards for compare/saved views, keyed by id (kept small). */
  cards: Record<string, ProductCard>;
  onboardingOpen: boolean;
};

type Actions = {
  setProfile: (p: Partial<Profile>) => void;
  toggleLike: (card: ProductCard) => void;
  dislike: (card: ProductCard, reason: DislikeReason) => void;
  click: (card: ProductCard) => void;
  track: (kind: InteractionKind, card: ProductCard) => void;
  addSearch: (q: string) => void;
  toggleCompare: (card: ProductCard) => void;
  clearCompare: () => void;
  removeSignal: (kind: "liked" | "disliked" | "clicked" | "interactions", id: string) => void;
  setOnboardingOpen: (open: boolean) => void;
  addMemory: (facts: string[]) => void;
  removeMemory: (id: string) => void;
  reset: () => void;
};

export const toLite = (c: ProductCard): ProductLite => ({
  id: c.id,
  brand: c.brand,
  category: c.category,
  color: c.color,
  fabric: c.fabric,
  pattern: c.pattern,
  fit: c.fit,
  price: c.price,
  title: c.title,
  image: c.image,
});

const initial: State = {
  profile: { audiences: [], sizes: {}, budget: null, styles: [], avoidColors: [], avoidFabrics: [], onlyMySize: false, onboarded: false },
  signals: { liked: [], disliked: [], clicked: [], searches: [], interactions: [] },
  memory: [],
  saved: [],
  compare: [],
  cards: {},
  onboardingOpen: false,
};

const normFact = (s: string) => s.toLowerCase().replace(/[^a-z0-9₹]+/g, " ").trim();

const cap = <T>(arr: T[], n: number) => arr.slice(Math.max(0, arr.length - n));

export const useSession = create<State & Actions>()(
  persist(
    (set) => ({
      ...initial,
      setProfile: (p) => set((s) => ({ profile: { ...s.profile, ...p } })),
      toggleLike: (card) =>
        set((s) => {
          const has = s.saved.includes(card.id);
          return {
            saved: has ? s.saved.filter((id) => id !== card.id) : [...s.saved, card.id],
            signals: {
              ...s.signals,
              liked: has ? s.signals.liked.filter((p) => p.id !== card.id) : cap([...s.signals.liked, toLite(card)], 60),
              disliked: s.signals.disliked.filter((d) => d.p.id !== card.id),
            },
            cards: { ...s.cards, [card.id]: card },
          };
        }),
      dislike: (card, reason) =>
        set((s) => ({
          saved: s.saved.filter((id) => id !== card.id),
          signals: {
            ...s.signals,
            liked: s.signals.liked.filter((p) => p.id !== card.id),
            disliked: cap([...s.signals.disliked.filter((d) => d.p.id !== card.id), { p: toLite(card), reason }], 60),
          },
        })),
      click: (card) =>
        set((s) => ({
          signals: {
            ...s.signals,
            clicked: cap([...s.signals.clicked.filter((p) => p.id !== card.id), toLite(card)], 40),
            interactions: cap([...(s.signals.interactions ?? []), { kind: "click", p: toLite(card), at: Date.now() }], 200),
          },
        })),
      track: (kind, card) =>
        set((s) => ({ signals: { ...s.signals, interactions: cap([...(s.signals.interactions ?? []), { kind, p: toLite(card), at: Date.now() }], 200) } })),
      addSearch: (q) =>
        set((s) => {
          const t = q.trim();
          if (!t) return s;
          return { signals: { ...s.signals, searches: cap([...s.signals.searches.filter((x) => x.toLowerCase() !== t.toLowerCase()), t], 20) } };
        }),
      toggleCompare: (card) =>
        set((s) => {
          if (s.compare.includes(card.id)) return { compare: s.compare.filter((id) => id !== card.id) };
          if (s.compare.length >= 3) return s;
          return {
            compare: [...s.compare, card.id],
            cards: { ...s.cards, [card.id]: card },
            signals: { ...s.signals, interactions: cap([...(s.signals.interactions ?? []), { kind: "compare", p: toLite(card), at: Date.now() }], 200) },
          };
        }),
      clearCompare: () => set({ compare: [] }),
      removeSignal: (kind, id) =>
        set((s) => ({
          signals: {
            ...s.signals,
            [kind]:
              kind === "disliked"
                ? s.signals.disliked.filter((d) => d.p.id !== id)
                : kind === "interactions"
                  ? (s.signals.interactions ?? []).filter((i) => i.p.id !== id)
                  : s.signals[kind].filter((p) => p.id !== id),
          },
          saved: kind === "liked" ? s.saved.filter((x) => x !== id) : s.saved,
        })),
      setOnboardingOpen: (open) => set({ onboardingOpen: open }),
      addMemory: (facts) =>
        set((s) => {
          const seen = new Set(s.memory.map((m) => normFact(m.text)));
          const fresh = facts
            .map((t) => t.trim())
            .filter((t) => t && !seen.has(normFact(t)))
            .map((text) => ({ id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, text, at: Date.now() }));
          return fresh.length ? { memory: cap([...s.memory, ...fresh], 30) } : s;
        }),
      removeMemory: (id) => set((s) => ({ memory: s.memory.filter((m) => m.id !== id) })),
      reset: () => set({ ...initial }),
    }),
    {
      name: "drape.session.v1",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ profile: s.profile, signals: s.signals, memory: s.memory, saved: s.saved, compare: s.compare, cards: pruneCards(s) }),
      migrate: (persisted, version) => {
        // v0 → v1: no shape changes yet; merge onto defaults so new fields always exist.
        const p = (persisted ?? {}) as Partial<State>;
        if (version < 1) return { ...initial, ...p } as State & Actions;
        return p as State & Actions;
      },
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<State>;
        return {
          ...current,
          ...p,
          profile: { ...initial.profile, ...p.profile },
          signals: { ...initial.signals, ...p.signals },
          memory: p.memory ?? [],
        };
      },
    },
  ),
);

/** Keep only cards still referenced by saved/compare, so storage stays small. */
function pruneCards(s: State): Record<string, ProductCard> {
  const keep = new Set([...s.saved, ...s.compare]);
  return Object.fromEntries(Object.entries(s.cards).filter(([id]) => keep.has(id)));
}
