"use client";

import { AnimatePresence } from "framer-motion";
import { ArrowRight, Info, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DebugPanel } from "@/components/debug/DebugPanel";
import { ProductCard, ProductSkeleton } from "@/components/product/ProductCard";
import { ProductDetails } from "@/components/product/ProductDetails";
import { RefineDrawer } from "@/components/chat/RefineDrawer";
import { SearchBox } from "@/components/search/SearchBox";
import { Drawer } from "@/components/ui/Drawer";
import { useAgentStream, type RailState } from "@/hooks/useAgentStream";
import { removeChip } from "@/lib/agent/chips";
import type { Intent, ProductCard as Card, SmartFilter } from "@/lib/agent/types";
import { cn, decodeState, editHref, encodeState } from "@/lib/format";
import { useTastePayload } from "@/hooks/useTaste";
import { useSession } from "@/store/session";
import { BecauseYouLiked } from "./BecauseYouLiked";
import { IntentChips } from "./IntentChips";
import { SmartFilters } from "./SmartFilters";
import { StepsTimeline } from "./StepsTimeline";

const SORTS: { id: Intent["sort"]; label: string }[] = [
  { id: "relevance", label: "Best match" },
  { id: "price_asc", label: "Price ↑" },
  { id: "price_desc", label: "Price ↓" },
];

const CLARIFY_AUDIENCE: Record<string, Intent["audience"]> = {
  women: { segment: "women", kidGender: null, ageYears: null, source: "explicit" },
  men: { segment: "men", kidGender: null, ageYears: null, source: "explicit" },
  kids: { segment: "kids", kidGender: "any", ageYears: null, source: "explicit" },
  girls: { segment: "kids", kidGender: "girl", ageYears: null, source: "explicit" },
  boys: { segment: "kids", kidGender: "boy", ageYears: null, source: "explicit" },
};

export function ResultsView({
  query,
  initialState,
  debug,
  banner,
  image,
}: {
  query: string;
  initialState?: string;
  debug: boolean;
  banner?: string;
  /** Image search: the first run goes through the vision model (brief §9.5). */
  image?: { dataUrl: string; text: string };
}) {
  const router = useRouter();
  const { state, start, apply } = useAgentStream();
  const taste = useTastePayload();
  const disliked = useSession((s) => s.signals.disliked);
  const addSearch = useSession((s) => s.addSearch);
  const [strict, setStrict] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [quick, setQuick] = useState<Card | null>(null);
  const [refineOpen, setRefineOpen] = useState(false);
  const started = useRef(false);

  const hidden = useMemo(() => new Set(disliked.map((d) => d.p.id)), [disliked]);

  const run = useCallback(
    (opts: { intent?: Intent; strict?: boolean } = {}) => {
      setShowMore(false);
      const s = opts.strict ?? strict;
      start("/api/search", { query, intent: opts.intent, taste, debug, strict: s });
      // Refined state is shareable: ?s=<base64url intent>.
      const params = new URLSearchParams();
      if (opts.intent) params.set("s", encodeState(opts.intent));
      if (debug) params.set("debug", "1");
      const qs = params.toString();
      window.history.replaceState(null, "", `${editHref(query)}${qs ? `?${qs}` : ""}`);
    },
    [query, taste, debug, strict, start],
  );

  // Starting the search stream is a subscription to an external system (the SSE endpoint); the
  // reducer's "start" dispatch inside it is intentional.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (image) {
      start("/api/image-search", { imageBase64: image.dataUrl, text: image.text || undefined, taste, debug });
      return;
    }
    addSearch(query);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    run({ intent: decodeState<Intent>(initialState) ?? undefined });
  }, [query, initialState, run, addSearch, image, start, taste, debug]);

  const intent = state.intent;
  const edit = (next: Intent) => run({ intent: next });

  const pickFilter = (f: SmartFilter, optionId: string) => {
    if (!intent) return;
    const opt = f.options.find((o) => o.id === optionId);
    if (f.field === "price") return edit({ ...intent, price: { min: opt?.min ?? null, max: opt?.max ?? null, strength: "must" } });
    const c = intent[f.field];
    edit({ ...intent, [f.field]: { ...c, include: [...new Set([...c.include, optionId])], strength: "must" } });
  };

  const moreLike = async (p: Card) => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    apply({ type: "step", id: "search", label: `Finding looks like “${p.title}”`, status: "running" });
    const res = await fetch("/api/similar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: p.id, k: 36 }) });
    const j = (await res.json().catch(() => ({ products: [] }))) as { products: Card[] };
    apply({ type: "step", id: "search", label: `Finding looks like “${p.title}”`, status: "done" });
    apply({ type: "results", railId: "main", title: `Like ${p.title}`, products: j.products.slice(0, 24), more: j.products.slice(24), total: j.products.length });
  };

  const running = state.status === "running";
  const rails = state.railOrder.map((id) => state.rails[id]).filter(Boolean);
  const main = state.rails.main;
  const nothing = state.status === "done" && rails.every((r) => r.loaded && r.products.length === 0);

  return (
    <div className={cn("mx-auto w-full max-w-7xl px-4 pb-32 pt-4 md:px-8", debug && "md:pl-[29rem]")}>
      <SearchBox initial={query} compact />
      {banner && <div className="mt-3 rounded-xl bg-accent-soft px-4 py-2 text-sm text-accent">{banner}</div>}

      <div className="mt-4 flex flex-col gap-3">
        {image && (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image.dataUrl} alt="Your photo" className="h-14 w-11 rounded-lg object-cover ring-1 ring-line" />
            <p className="text-xs text-ink-soft">Matched by description, not pixels: I describe your photo, then search for pieces that fit that description.</p>
          </div>
        )}
        {state.chips.length > 0 && (
          <IntentChips
            chips={state.chips}
            intent={intent}
            personalized={state.personalized}
            onRemove={(key) => intent && edit(removeChip(intent, key))}
            onIntent={edit}
            onAdd={(text) => router.push(editHref(`${query}, ${text}`))}
          />
        )}
        <StepsTimeline steps={state.steps} running={running} totalMs={state.done?.timings.total} />
      </div>

      {state.error && (
        <div className="mt-6 flex items-center gap-3 rounded-xl border border-warn/30 bg-warn/5 px-4 py-3 text-sm text-warn">
          {state.error.message}
          {state.error.retryable && (
            <button onClick={() => run({ intent: intent ?? undefined })} className="ml-auto inline-flex items-center gap-1 rounded-full border border-warn/40 px-3 py-1 hover:bg-warn/10">
              <RotateCcw size={13} /> Retry
            </button>
          )}
        </div>
      )}

      {state.clarify && intent && (
        <div className="mt-5 rounded-2xl border border-line bg-paper p-4">
          <p className="text-sm">
            {state.clarify.question} <span className="text-ink-faint">Showing a best guess below.</span>
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {state.clarify.options.map((o) => {
              const aud = CLARIFY_AUDIENCE[o.toLowerCase()];
              return (
                <button
                  key={o}
                  className="rounded-full border border-line px-3 py-1 text-sm hover:border-ink"
                  onClick={() => (aud ? edit({ ...intent, audience: aud, needsClarification: null }) : router.push(editHref(`${query} ${o}`)))}
                >
                  {o}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {state.plan && (
        <div className="mt-6 max-w-3xl">
          <p className="font-display text-xl leading-relaxed md:text-2xl">{state.plan.stylistNote}</p>
        </div>
      )}

      {/* Occasion / vibe / gift: horizontal rails */}
      {state.plan &&
        rails
          .filter((r) => r.id !== "main")
          .map((r) => <RailRow key={r.id} rail={r} hidden={hidden} audience={intent?.audience.segment} onOpen={setQuick} onMoreLike={moreLike} />)}

      {/* Product intent: grid */}
      {!state.plan && (
        <section className="mt-6">
          {main?.loaded && (
            <div className="mb-3 flex flex-col gap-3">
              {main.title && <h2 className="font-display text-2xl">{main.title}</h2>}
              {main.relaxedNote && (
                <p className="inline-flex items-start gap-2 rounded-xl bg-sand px-3 py-2 text-sm text-ink-soft">
                  <Info size={15} className="mt-0.5 shrink-0" /> {main.relaxedNote}
                </p>
              )}
              {main.smartFilters && <SmartFilters filters={main.smartFilters} onPick={pickFilter} />}
              <div className="flex items-center gap-3 text-sm">
                <span className="text-ink-soft">{main.products.length + main.more.length} picks</span>
                <label className="ml-auto inline-flex items-center gap-1.5 text-ink-soft">
                  <input
                    type="checkbox"
                    checked={strict}
                    onChange={(e) => {
                      setStrict(e.target.checked);
                      run({ intent: intent ?? undefined, strict: e.target.checked });
                    }}
                  />
                  Strict mode
                </label>
                <select
                  value={intent?.sort ?? "relevance"}
                  onChange={(e) => intent && edit({ ...intent, sort: e.target.value as Intent["sort"] })}
                  className="rounded-full border border-line bg-paper px-3 py-1"
                  aria-label="Sort"
                >
                  {SORTS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {main?.loaded ? (
              <AnimatePresence>
                {[...main.products, ...(showMore ? main.more : [])]
                  .filter((p) => !hidden.has(p.id))
                  .map((p, i) => (
                    <ProductCard key={p.id} p={p} index={i} onOpen={setQuick} onMoreLike={moreLike} />
                  ))}
              </AnimatePresence>
            ) : (
              !state.error && Array.from({ length: 10 }).map((_, i) => <ProductSkeleton key={i} />)
            )}
          </div>
          {main?.loaded && main.more.length > 0 && !showMore && (
            <div className="mt-8 flex justify-center">
              <button onClick={() => setShowMore(true)} className="rounded-full border border-ink px-5 py-2 text-sm hover:bg-ink hover:text-canvas">
                Show more
              </button>
            </div>
          )}
        </section>
      )}

      {!state.plan && main?.loaded && state.status === "done" && <BecauseYouLiked results={main.products} onOpen={setQuick} />}

      {nothing && <EmptyState query={query} intent={intent} note={main?.relaxedNote} />}

      <button
        onClick={() => setRefineOpen(true)}
        className="fixed bottom-5 right-5 z-30 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-medium text-canvas shadow-xl hover:bg-ink/90"
      >
        Refine with Drape
      </button>

      <RefineDrawer
        open={refineOpen}
        onClose={() => setRefineOpen(false)}
        query={query}
        intent={intent}
        visible={(main?.products ?? rails.flatMap((r) => r.products)).filter((p) => !hidden.has(p.id)).slice(0, 12)}
        onEvent={apply}
        onIntent={(next) => {
          window.history.replaceState(null, "", `${editHref(query)}?s=${encodeState(next)}${debug ? "&debug=1" : ""}`);
        }}
      />

      <Drawer open={!!quick} onClose={() => setQuick(null)} title={quick?.brand}>
        {quick && <ProductDetails p={quick} onOpen={setQuick} />}
      </Drawer>

      {debug && <DebugPanel state={state} query={query} />}
    </div>
  );
}

function RailRow({
  rail,
  hidden,
  audience,
  onOpen,
  onMoreLike,
}: {
  rail: RailState;
  hidden: Set<string>;
  audience?: string;
  onOpen: (p: Card) => void;
  onMoreLike: (p: Card) => void;
}) {
  const seeAll = `${rail.title ?? ""}${audience && audience !== "unknown" ? ` for ${audience}` : ""}`;
  return (
    <section className="mt-8">
      <div className="mb-3 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-xl">{rail.title}</h2>
          {rail.why && <p className="text-sm text-ink-soft">{rail.why}</p>}
          {rail.relaxedNote && <p className="mt-1 text-xs text-ink-faint">{rail.relaxedNote}</p>}
        </div>
        <Link href={editHref(seeAll)} className="inline-flex shrink-0 items-center gap-1 text-sm text-ink-soft hover:text-ink">
          See all <ArrowRight size={14} />
        </Link>
      </div>
      <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 md:-mx-8 md:px-8">
        {rail.loaded
          ? rail.products.filter((p) => !hidden.has(p.id)).map((p, i) => <ProductCard key={p.id} p={p} index={i} compact onOpen={onOpen} onMoreLike={onMoreLike} />)
          : Array.from({ length: 6 }).map((_, i) => <ProductSkeleton key={i} compact />)}
        {rail.loaded && rail.products.length === 0 && <p className="py-8 text-sm text-ink-soft">Nothing suitable in stock for this one.</p>}
      </div>
    </section>
  );
}

function EmptyState({ query, intent, note }: { query: string; intent: Intent | null; note?: string }) {
  const suggestions = [
    intent?.semanticQuery,
    query.replace(/,?\s*(under|below|less than)\s*₹?\s*[\d,.]+k?/i, "").trim(),
    intent?.categories.include[0]?.replace(/-/g, " "),
  ].filter((s, i, a): s is string => !!s && s.toLowerCase() !== query.toLowerCase() && a.indexOf(s) === i);
  return (
    <div className="mt-10 rounded-2xl border border-line bg-paper p-6 text-center">
      <p className="font-display text-xl">Nothing matched every detail.</p>
      <p className="mt-2 text-sm text-ink-soft">{note ?? "I relaxed what I could without breaking your exclusions. Try one of these:"}</p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {suggestions.slice(0, 3).map((s) => (
          <Link key={s} href={editHref(s)} className="rounded-full border border-line px-3 py-1 text-sm hover:border-ink">
            {s}
          </Link>
        ))}
      </div>
    </div>
  );
}
