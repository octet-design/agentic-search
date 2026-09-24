/**
 * Retrieval for all rails in one multi_search, then per-rail curation and the relaxation ladder
 * (brief §6.4–6.5). Only rails that come back thin are re-queried.
 */
import { getTypesense, productsCollection } from "../typesense";
import { cleanText, cleanTitle, domainOf } from "./cleanText";
import { makeChecker } from "./postFilter";
import { buildQuery, type SearchParams } from "./queryBuilder";
import { relaxNote, relaxSteps, type RelaxStep } from "./relax";
import type { TaxonomyApi } from "./taxonomy";
import type { Intent, ProductCard, RawProduct } from "./types";

export const MIN_USABLE = 8;
export const TOP_N = 24;
export const MAX_PER_BRAND = 3;

export type RailSpec = { id: string; title?: string; intent: Intent; perPage: number; facets?: boolean };

export type FacetCounts = { field_name: string; counts: { value: string; count: number }[] }[];

export type RailResult = {
  id: string;
  title?: string;
  intent: Intent;
  /** Curated pool, best first, diversity applied. */
  products: ProductCard[];
  found: number;
  relaxed: RelaxStep[];
  relaxedNote?: string;
  facets?: FacetCounts;
  debug: {
    q: string;
    filter: string;
    rounds: { filter: string; found: number; hits: number; usable: number; ms: number; step?: string }[];
    dropped: Record<string, number>;
  };
};

type Hit = { document: RawProduct; hybrid_search_info?: { rank_fusion_score?: number }; text_match?: number; vector_distance?: number };
type SearchResponse = { found: number; hits?: Hit[]; facet_counts?: FacetCounts; search_time_ms: number; error?: string; code?: number };

export async function multiSearch(params: SearchParams[]): Promise<SearchResponse[]> {
  if (!params.length) return [];
  const collection = productsCollection();
  const res = (await getTypesense().multiSearch.perform({
    searches: params.map((p) => ({ collection, ...p })),
  } as never)) as unknown as { results: SearchResponse[] };
  return res.results.map((r) => {
    if (r.error) throw new Error(`Typesense ${r.code ?? ""}: ${r.error}`);
    return r;
  });
}

/** Display name from the taxonomy ("Jackjones" → "Jack & Jones"), else the cleaned raw value. */
export function brandLabel(raw: string, tax?: TaxonomyApi): string {
  const id = tax?.classify("brand", raw)[0];
  return id ? tax!.label("brand", id) : cleanText(raw);
}

export function toCard(d: RawProduct, score = 0, tax?: TaxonomyApi): ProductCard {
  return {
    id: d.id,
    title: cleanTitle(d.title, d.brand),
    brand: brandLabel(d.brand, tax),
    category: d.category,
    gender: d.gender,
    color: d.color,
    fabric: d.fabric ?? null,
    fit: d.fit ?? null,
    pattern: d.pattern ?? null,
    useCase: d.use_case ?? [],
    price: d.price,
    sizes: (d.sizes ?? []).map((s) => s.trim()).filter(Boolean),
    image: d.image_url || null,
    url: d.product_url,
    domain: domainOf(d.product_url),
    reason: "",
    matched: [],
    score,
  };
}

const normTitle = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/**
 * Post-filter, image check and dedupe; keeps the given order. `checkMusts` re-checks hard requirements
 * for hits that came from the lightly-filtered semantic leg.
 */
export function curate(hits: Hit[], intent: Intent, tax: TaxonomyApi, dropped: Record<string, number>, checkMusts = false): ProductCard[] {
  const checker = makeChecker(intent, tax);
  const seen = new Set<string>();
  const out: ProductCard[] = [];
  hits.forEach((h, i) => {
    const d = h.document;
    if (!d.image_url) {
      dropped["no-image"] = (dropped["no-image"] ?? 0) + 1;
      return;
    }
    const v = [...checker.violations(d), ...(checkMusts ? checker.unmet(d) : [])];
    if (v.length) {
      for (const r of v) dropped[r] = (dropped[r] ?? 0) + 1;
      return;
    }
    const card = toCard(d, 1 - i / Math.max(1, hits.length), tax);
    // Colour variants share titles, so colour is part of the key (docs/DECISIONS.md).
    const key = `${normTitle(card.brand)}|${normTitle(card.title)}|${card.color.toLowerCase()}`;
    if (seen.has(key)) {
      dropped.duplicate = (dropped.duplicate ?? 0) + 1;
      return;
    }
    seen.add(key);
    out.push(card);
  });
  return out;
}

/** At most `max` items per brand in the top `n`; the rest keep their order after. */
export function diversify<T extends { brand: string }>(items: T[], n = TOP_N, max = MAX_PER_BRAND): T[] {
  const top: T[] = [];
  const rest: T[] = [];
  const per = new Map<string, number>();
  for (const it of items) {
    const k = it.brand.toLowerCase();
    if (top.length < n && (per.get(k) ?? 0) < max) {
      top.push(it);
      per.set(k, (per.get(k) ?? 0) + 1);
    } else rest.push(it);
  }
  return [...top, ...rest];
}

/** Reciprocal-rank fusion of the exact and semantic legs (k = 60). */
export function fuse(legs: ProductCard[][], k = 60): ProductCard[] {
  const score = new Map<string, number>();
  const card = new Map<string, ProductCard>();
  for (const leg of legs) {
    leg.forEach((p, rank) => {
      score.set(p.id, (score.get(p.id) ?? 0) + 1 / (k + rank + 1));
      if (!card.has(p.id)) card.set(p.id, p);
    });
  }
  const max = Math.max(...score.values(), 1e-9);
  return [...card.values()]
    .map((p) => ({ ...p, score: (score.get(p.id) ?? 0) / max }))
    .sort((a, b) => b.score - a.score);
}

/** Dedupe again after fusion (the same product variant can arrive from both legs under different ids). */
function dedupe(cards: ProductCard[]): ProductCard[] {
  const seen = new Set<string>();
  return cards.filter((c) => {
    const key = `${normTitle(c.brand)}|${normTitle(c.title)}|${c.color.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export type RetrieveOptions = { alpha?: number; strict?: boolean; onRelax?: (railId: string, step: RelaxStep) => void };

export async function retrieveRails(specs: RailSpec[], tax: TaxonomyApi, opts: RetrieveOptions = {}): Promise<RailResult[]> {
  type State = {
    spec: RailSpec;
    intent: Intent;
    steps: RelaxStep[];
    next: number;
    applied: RelaxStep[];
    result?: RailResult;
    done: boolean;
  };
  const states: State[] = specs.map((spec) => ({
    spec,
    intent: spec.intent,
    steps: opts.strict ? [] : relaxSteps(spec.intent, tax),
    next: 0,
    applied: [],
    done: false,
  }));

  for (let round = 0; round < 10; round++) {
    const active = states.filter((s) => !s.done);
    if (!active.length) break;
    // Two legs per rail: exact (all filters, keyword) + semantic (light filter, hybrid).
    const built = active.map((s) => ({
      exact: buildQuery(s.intent, tax, { perPage: s.spec.perPage, mode: "exact" }),
      semantic: buildQuery(s.intent, tax, { perPage: Math.max(s.spec.perPage, 100), mode: "semantic", alpha: opts.alpha }),
    }));
    const t0 = performance.now();
    const responses = await multiSearch(built.flatMap((b) => [b.exact.params, b.semantic.params]));
    const ms = Math.round(performance.now() - t0);

    active.forEach((s, i) => {
      const exact = responses[2 * i];
      const semantic = responses[2 * i + 1];
      const dropped: Record<string, number> = {};
      const products = dedupe(
        fuse([curate(exact.hits ?? [], s.intent, tax, dropped), curate(semantic.hits ?? [], s.intent, tax, dropped, true)]),
      );
      const r = { found: exact.found, facet_counts: undefined as FacetCounts | undefined };
      const rounds = [
        ...(s.result?.debug.rounds ?? []),
        {
          filter: built[i].exact.filter,
          found: exact.found,
          hits: (exact.hits?.length ?? 0) + (semantic.hits?.length ?? 0),
          usable: products.length,
          ms,
          step: s.applied.at(-1)?.id,
        },
      ];
      s.result = {
        id: s.spec.id,
        title: s.spec.title,
        intent: s.intent,
        products: diversify(products),
        found: r.found,
        relaxed: [...s.applied],
        relaxedNote: relaxNote(s.applied),
        facets: r.facet_counts,
        debug: { q: built[i].semantic.q, filter: built[i].exact.filter, rounds, dropped },
      };
      if (products.length >= MIN_USABLE || s.next >= s.steps.length) {
        s.done = true;
        return;
      }
      const step = s.steps[s.next++];
      s.applied.push(step);
      s.intent = step.apply(s.intent);
      opts.onRelax?.(s.spec.id, step);
    });
  }
  return states.map((s) => s.result!);
}
