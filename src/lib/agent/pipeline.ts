/**
 * The search agent: understand → clarify → plan → retrieve → relax → curate → adapt → explain
 * (brief §6). Emits typed events; the route handler turns them into SSE, the eval script collects them.
 */
import { hashKey, namedCache } from "../cache";
import { Usage, withTimeout } from "../llm";
import { deriveChips } from "./chips";
import { extractIntent, mergeIntent, sanitizeIntent } from "./intent";
import { applyTaste, type TastePayload } from "./personalize";
import { planRails, rewriteQuery, type Plan } from "./plan";
import { deterministicReason } from "./reasons";
import { applyRerank, rerank, type RerankItem } from "./rerank";
import { diversify, retrieveRails, type RailResult, type RailSpec } from "./retrieve";
import { smartFilters } from "./smartFilters";
import { getTaxonomy, type TaxonomyApi } from "./taxonomy";
import { STEP_LABELS, type Emit, type Intent, type IntentPatch, type ProductCard, type StepId } from "./types";

export const RERANK_TIMEOUT_MS = 5_000;
const MAIN_POOL = 36;
const RAIL_POOL = 18;
const MAIN_SHOW = 24;
const RAIL_SHOW = 12;
const PLAN_KINDS = new Set(["occasion", "vibe", "gift", "browse"]);

export type SearchRequest = {
  query: string;
  /** Replaces the understood intent entirely (chip edits, refine agent, image search). */
  intent?: Intent;
  overrides?: IntentPatch;
  taste?: TastePayload;
  debug?: boolean;
  strict?: boolean;
  rerank?: boolean;
  /** Skip the planner even for occasion queries (refine agent "see all"). */
  noPlan?: boolean;
  today?: Date;
  signal?: AbortSignal;
};

const intentCache = namedCache<Intent>("intent");
const planCache = namedCache<Plan>("plan");

export const normalizeQuery = (q: string) => q.toLowerCase().replace(/\s+/g, " ").trim();

export async function runSearch(req: SearchRequest, emit: Emit): Promise<void> {
  const tax = getTaxonomy();
  const usage = new Usage();
  const timings: Record<string, number> = {};
  const t0 = performance.now();
  let cacheHit = false;
  const debug: Record<string, unknown> = { query: req.query };

  const step = async <T>(id: StepId, fn: () => Promise<T>, detail?: string): Promise<T> => {
    emit({ type: "step", id, label: STEP_LABELS[id], status: "running", detail });
    const s = performance.now();
    const r = await fn();
    timings[id] = Math.round(performance.now() - s);
    emit({ type: "step", id, label: STEP_LABELS[id], status: "done", ms: timings[id] });
    return r;
  };

  // 1. Understand
  let intent = await step("understand", async () => {
    if (req.intent) return sanitizeIntent(req.intent, tax, req.query);
    const key = hashKey(normalizeQuery(req.query), req.taste?.audiences ?? [], req.taste?.bucket ?? "");
    const hit = intentCache.get(key);
    if (hit) {
      cacheHit = true;
      return structuredClone(hit);
    }
    const extracted = await extractIntent(req.query, tax, {
      today: req.today,
      tasteSummary: req.taste?.summary,
      profileAudiences: req.taste?.audiences,
      usage,
      signal: req.signal,
    });
    intentCache.set(key, extracted);
    return structuredClone(extracted);
  });
  const personalized = applyTaste(intent, req.taste, tax);
  intent = personalized.intent;
  if (req.overrides) intent = sanitizeIntent(mergeIntent(intent, req.overrides), tax, req.query);
  emit({ type: "intent", intent, chips: deriveChips(intent, tax), personalized: personalized.notes });
  debug.intent = intent;

  // 2. Clarify (non-blocking: best-guess results still follow)
  if (intent.needsClarification && !req.intent) {
    emit({ type: "clarify", question: intent.needsClarification.question, options: intent.needsClarification.options });
  }

  // 3. Plan
  let plan: Plan | null = null;
  if (PLAN_KINDS.has(intent.kind) && !req.noPlan) {
    plan = await step("plan", async () => {
      const key = hashKey(normalizeQuery(req.query), intent);
      const hit = planCache.get(key);
      if (hit) return hit;
      try {
        const p = await planRails({ query: req.query, intent, tax, today: req.today, usage, signal: req.signal });
        if (p.rails.length) planCache.set(key, p);
        return p;
      } catch (err) {
        debug.planError = String(err);
        return null;
      }
    });
    if (plan?.rails.length) emit({ type: "plan", stylistNote: plan.stylistNote, rails: plan.rails.map(({ id, title, why }) => ({ id, title, why })) });
    else plan = null;
  }

  // 4–5. Retrieve (+ relax)
  const specs: RailSpec[] = plan
    ? plan.rails.map((r) => ({ id: r.id, title: r.title, intent: r.intent, perPage: 40 }))
    : [{ id: "main", intent, perPage: 80, facets: true }];
  let relaxedAny = false;
  const rails = await step("search", () =>
    retrieveRails(specs, tax, {
      strict: req.strict,
      onRelax: (railId, s) => {
        if (!relaxedAny) emit({ type: "step", id: "relax", label: STEP_LABELS.relax, status: "running", detail: s.note });
        relaxedAny = true;
      },
    }),
  );
  if (relaxedAny) emit({ type: "step", id: "relax", label: STEP_LABELS.relax, status: "done" });

  // 6. Curate: rerank rails in parallel with a hard timeout; deterministic reasons as fallback.
  const late: Promise<void>[] = [];
  const rerankDebug: Record<string, unknown> = {};
  const curateRail = async (rail: RailResult, allowAdapt: boolean): Promise<RailResult> => {
    const pool = rail.products.slice(0, rail.id === "main" ? MAIN_POOL : RAIL_POOL);
    const withFallback = pool.map((p) => ({ ...p, ...deterministicReason(p, rail.intent, tax) }));
    if (req.rerank === false || !pool.length) {
      publish(rail, withFallback);
      return rail;
    }
    const errors: string[] = [];
    const pending = rerank({ query: req.query, intent: rail.intent, tax, products: withFallback, taste: req.taste?.summary, usage, signal: req.signal, errors });
    const items = await withTimeout(pending, RERANK_TIMEOUT_MS);
    if (!items) {
      rerankDebug[rail.id] = { timeout: true, errors };
      publish(rail, withFallback);
      // Update reasons in place when the LLM finishes; never reorder what the user already sees.
      late.push(
        pending.then((its) => {
          const shown = new Set(withFallback.map((p) => p.id));
          const upd = its.filter((it) => shown.has(it.id) && it.reason && !it.violates.length);
          if (upd.length) emit({ type: "reasons", railId: rail.id, items: upd.map(({ id, reason, matched }) => ({ id, reason, matched })) });
        }).catch(() => undefined),
      );
      return rail;
    }
    const { kept, dropped } = applyRerank(withFallback, items, rail.intent.textExclusions);
    rerankDebug[rail.id] = { scored: items.length, kept: kept.length, dropped, errors };
    const good = kept.filter((p) => p.score >= 0.5).length;
    if (allowAdapt && good < 6 && !req.strict) {
      const adapted = await adapt(rail, items);
      if (adapted) return adapted;
    }
    publish(rail, kept);
    return rail;
  };

  const adapt = async (rail: RailResult, firstItems: RerankItem[]): Promise<RailResult | null> =>
    step("adapt", async () => {
      try {
        const semanticQuery = await rewriteQuery({ query: req.query, intent: rail.intent, tax, usage, signal: req.signal });
        const [retry] = await retrieveRails([{ id: rail.id, intent: { ...rail.intent, semanticQuery }, perPage: 80, facets: true }], tax, { strict: req.strict });
        const seen = new Set(firstItems.map((i) => i.id));
        const fresh = retry.products.filter((p) => !seen.has(p.id)).slice(0, 36).map((p) => ({ ...p, ...deterministicReason(p, retry.intent, tax) }));
        const items = (await withTimeout(rerank({ query: req.query, intent: retry.intent, tax, products: fresh, taste: req.taste?.summary, usage }), RERANK_TIMEOUT_MS)) ?? [];
        const firstPool = rail.products.slice(0, MAIN_POOL).map((p) => ({ ...p, ...deterministicReason(p, rail.intent, tax) }));
        const merged = applyRerank([...firstPool, ...fresh], [...firstItems, ...items], rail.intent.textExclusions);
        debug.adapt = { semanticQuery, fresh: fresh.length, kept: merged.kept.length };
        const result = { ...rail, debug: { ...rail.debug, adaptedQ: semanticQuery } } as RailResult;
        publish(result, merged.kept);
        return result;
      } catch (err) {
        debug.adaptError = String(err);
        return null;
      }
    });

  const publish = (rail: RailResult, ordered: ProductCard[]) => {
    const show = rail.id === "main" ? MAIN_SHOW : RAIL_SHOW;
    const diverse = diversify(ordered, show);
    emit({
      type: "results",
      railId: rail.id,
      title: rail.title,
      products: diverse.slice(0, show),
      more: diverse.slice(show, rail.id === "main" ? 96 : 24),
      relaxedNote: rail.relaxedNote,
      smartFilters: rail.id === "main" ? smartFilters(ordered, rail.intent, tax) : undefined,
      total: rail.found,
    });
  };

  await step("curate", () => Promise.all(rails.map((r) => curateRail(r, r.id === "main"))));
  if (late.length) await withTimeout(Promise.all(late), 10_000);

  timings.total = Math.round(performance.now() - t0);
  if (req.debug) {
    emit({
      type: "debug",
      data: {
        ...debug,
        rails: rails.map((r) => ({ id: r.id, title: r.title, q: r.debug.q, filter: r.debug.filter, rounds: r.debug.rounds, dropped: r.debug.dropped, relaxed: r.relaxed.map((s) => s.id), found: r.found })),
        rerank: rerankDebug,
        llmCalls: usage.calls,
        cachedInputTokens: usage.cachedIn,
      },
    });
  }
  emit({ type: "done", timings, tokens: { in: usage.in, out: usage.out }, costUsd: +usage.costUsd.toFixed(5), cacheHit });
  logRun(req.query, timings, usage, cacheHit);
}

function logRun(query: string, timings: Record<string, number>, usage: Usage, cacheHit: boolean) {
  if (process.env.NODE_ENV === "test") return;
  console.log(JSON.stringify({ at: new Date().toISOString(), event: "search", query, timings, tokens: { in: usage.in, out: usage.out }, costUsd: +usage.costUsd.toFixed(5), cacheHit }));
}

export type { TaxonomyApi };
