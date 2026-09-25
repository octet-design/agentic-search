/**
 * Derived session taste. Pure; runs client-side and is sent with every request.
 * Weights: like +3, dislike −3, and interactions with a 14-day half-life:
 * quick-view open +1, reading it 5s+ +1, outbound "Shop" click +2, add to compare +1, "More like this" +2.
 */
import type { ProductLite } from "./agent/types";

export type InteractionKind = "view" | "dwell" | "click" | "compare" | "more_like";
export type Interaction = { kind: InteractionKind; p: ProductLite; at: number };

export const INTERACTION_WEIGHTS: Record<InteractionKind, number> = { view: 1, dwell: 1, click: 2, compare: 1, more_like: 2 };
const HALF_LIFE_MS = 14 * 24 * 60 * 60 * 1000;

/** 1 now, 0.5 after 14 days, 0.25 after 28… */
export const decay = (at: number, now = Date.now()) => Math.pow(0.5, Math.max(0, now - at) / HALF_LIFE_MS);

export type TasteInputs = {
  profile: {
    audiences: ("women" | "men" | "girls" | "boys")[];
    sizes: { top?: string; bottom?: string; footwear?: string };
    budget: { min?: number; max?: number } | null;
    styles: string[];
    avoidColors: string[];
    avoidFabrics: string[];
    onlyMySize: boolean;
  };
  signals: {
    liked: ProductLite[];
    disliked: { p: ProductLite; reason: "price" | "style" | "color" | "fabric" | "other" }[];
    clicked: ProductLite[];
    interactions?: Interaction[];
  };
};

export type Taste = {
  brands: string[];
  colors: string[];
  categories: string[];
  fabrics: string[];
  patterns: string[];
  priceBand: { min: number; max: number } | null;
  avoidColors: string[];
  avoidFabrics: string[];
  avoidBrands: string[];
  styles: string[];
  empty: boolean;
};

const norm = (s: string | null | undefined) => (s ?? "").trim().toLowerCase();
/** "100% cotton", "pure cotton", "Cotton 100%" → "cotton" so learned fabrics don't show near-duplicates. */
const normFabric = (s: string | null | undefined) =>
  norm(s)
    .replace(/\b(100\s?%|100 per ?cent|pure|premium|super combed|combed|organic)\s*/g, "")
    .replace(/\s*100\s?%$/, "")
    .trim();

function top(scores: Map<string, number>, n = 5): string[] {
  return [...scores.entries()]
    .filter(([k, v]) => k && v > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([k]) => k);
}

function pct(sorted: number[], p: number) {
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.floor(p * (sorted.length - 1))))];
}

export function deriveTaste({ profile, signals }: TasteInputs): Taste {
  const fields = ["brand", "color", "category", "fabric", "pattern"] as const;
  const scores = Object.fromEntries(fields.map((f) => [f, new Map<string, number>()])) as Record<(typeof fields)[number], Map<string, number>>;
  const add = (p: ProductLite, w: number) => {
    for (const f of fields) {
      const v = f === "fabric" ? normFabric(p[f]) : norm(p[f]);
      if (v) scores[f].set(v, (scores[f].get(v) ?? 0) + w);
    }
  };
  const interactions = signals.interactions ?? [];
  for (const p of signals.liked) add(p, 3);
  // Older sessions only have the plain click list; newer ones log weighted, decaying interactions.
  if (!interactions.length) for (const p of signals.clicked) add(p, 2);
  for (const it of interactions) add(it.p, INTERACTION_WEIGHTS[it.kind] * decay(it.at));
  for (const d of signals.disliked) add(d.p, -3);

  const engaged = [...signals.liked, ...(interactions.length ? interactions.filter((i) => i.kind !== "view").map((i) => i.p) : signals.clicked)];
  const prices = engaged.map((p) => p.price).filter((x) => x > 0).sort((a, b) => a - b);
  const priceBand = prices.length >= 2 ? { min: Math.round(pct(prices, 0.25)), max: Math.round(pct(prices, 0.75)) } : null;

  const brandDislikes = new Map<string, number>();
  for (const d of signals.disliked) brandDislikes.set(norm(d.p.brand), (brandDislikes.get(norm(d.p.brand)) ?? 0) + 1);

  const avoidColors = [...new Set([...profile.avoidColors.map(norm), ...signals.disliked.filter((d) => d.reason === "color").map((d) => norm(d.p.color))])].filter(Boolean);
  const avoidFabrics = [...new Set([...profile.avoidFabrics.map(norm), ...signals.disliked.filter((d) => d.reason === "fabric").map((d) => norm(d.p.fabric))])].filter(Boolean);
  const avoidBrands = [...brandDislikes.entries()].filter(([, n]) => n >= 2).map(([b]) => b);

  const taste: Taste = {
    brands: top(scores.brand).filter((b) => !avoidBrands.includes(b)),
    colors: top(scores.color).filter((c) => !avoidColors.includes(c)),
    categories: top(scores.category),
    fabrics: top(scores.fabric).filter((f) => !avoidFabrics.includes(f)),
    patterns: top(scores.pattern),
    priceBand,
    avoidColors,
    avoidFabrics,
    avoidBrands,
    styles: profile.styles,
    empty: false,
  };
  taste.empty =
    !taste.brands.length && !taste.colors.length && !taste.categories.length && !taste.fabrics.length && !taste.avoidColors.length && !taste.avoidFabrics.length && !taste.styles.length && !priceBand;
  return taste;
}

const k = (n: number) => (n >= 1000 ? `${+(n / 1000).toFixed(1)}k` : String(n));

/** Compact (< 400 tokens) summary for prompts. */
export function serializeTaste(t: Taste): string {
  if (t.empty) return "";
  const likes: string[] = [];
  if (t.brands.length) likes.push(`brands[${t.brands.join(", ")}]`);
  if (t.colors.length) likes.push(`colors[${t.colors.join(", ")}]`);
  if (t.categories.length) likes.push(`categories[${t.categories.join(", ")}]`);
  if (t.fabrics.length) likes.push(`fabrics[${t.fabrics.join(", ")}]`);
  if (t.patterns.length) likes.push(`patterns[${t.patterns.join(", ")}]`);
  if (t.priceBand) likes.push(`band ₹${k(t.priceBand.min)}–${k(t.priceBand.max)}`);
  if (t.styles.length) likes.push(`styles[${t.styles.join(", ")}]`);
  const avoids: string[] = [];
  if (t.avoidColors.length) avoids.push(`colors[${t.avoidColors.join(", ")}]`);
  if (t.avoidFabrics.length) avoids.push(`fabrics[${t.avoidFabrics.join(", ")}]`);
  if (t.avoidBrands.length) avoids.push(`brands[${t.avoidBrands.join(", ")}]`);
  return [likes.length ? `likes: ${likes.join(", ")}` : "", avoids.length ? `avoids: ${avoids.join(", ")}` : ""].filter(Boolean).join("; ").slice(0, 1500);
}

/** Payload sent with every API request (validated server-side by TastePayloadSchema). */
export function tastePayload(inputs: TasteInputs) {
  const t = deriveTaste(inputs);
  const summary = serializeTaste(t);
  return {
    summary,
    audiences: inputs.profile.audiences,
    budget: inputs.profile.budget ? { min: inputs.profile.budget.min ?? null, max: inputs.profile.budget.max ?? null } : null,
    sizes: inputs.profile.sizes,
    onlyMySize: inputs.profile.onlyMySize,
    avoidColors: t.avoidColors,
    avoidFabrics: t.avoidFabrics,
    likes: { colors: t.colors, fabrics: t.fabrics, brands: t.brands, categories: t.categories },
    bucket: summary ? hash(`${summary}|${inputs.profile.audiences.join(",")}`) : "",
  };
}

function hash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

/**
 * Products that best represent the user's taste (likes + weighted interactions − dislikes), used to seed
 * the "For you" vector search. Only products with real engagement count: score ≥ 1.5 (a click, a save, or a
 * view + a 5s read; decay makes view + dwell slightly under 2).
 */
export function seedIds(inputs: TasteInputs, n = 10): string[] {
  const score = new Map<string, number>();
  const bump = (id: string, w: number) => score.set(id, (score.get(id) ?? 0) + w);
  for (const p of inputs.signals.liked) bump(p.id, 3);
  const interactions = inputs.signals.interactions ?? [];
  if (!interactions.length) for (const p of inputs.signals.clicked) bump(p.id, 2);
  for (const it of interactions) bump(it.p.id, INTERACTION_WEIGHTS[it.kind] * decay(it.at));
  const disliked = new Set(inputs.signals.disliked.map((d) => d.p.id));
  return [...score.entries()]
    .filter(([id, s]) => s >= 1.5 && !disliked.has(id))
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([id]) => id);
}
