"use client";

import { ChevronRight, Info, Loader2, RotateCcw, Sparkles } from "lucide-react";
import { CompareBlock } from "@/components/compare/CompareBlock";
import { ProductCard, ProductSkeleton } from "@/components/product/ProductCard";
import type { ProductCard as Card } from "@/lib/agent/types";
import type { ChatSection, AssistantMessage as Msg } from "@/store/chats";
import { PicksBlock } from "./PicksBlock";
import { RichText } from "./RichText";

export function AssistantMessage({
  msg,
  isLast,
  hidden,
  onRef,
  refLabel,
  onOpen,
  onMoreLike,
  onSeeAll,
  onSend,
  onRetry,
}: {
  msg: Msg;
  isLast: boolean;
  hidden: Set<string>;
  onRef: (ref: number) => void;
  refLabel?: (ref: number) => string | undefined;
  onOpen: (p: Card) => void;
  onMoreLike: (p: Card) => void;
  onSeeAll: (s: ChatSection) => void;
  onSend: (text: string) => void;
  onRetry: () => void;
}) {
  const running = msg.status === "streaming";
  const current = msg.steps.find((s) => s.status === "running");
  const nothingYet = running && !msg.intro && !msg.answer && !msg.sections.length;
  const cards = new Map(msg.sections.flatMap((s) => s.products).flatMap((p) => (p.ref != null ? [[p.ref, p] as const] : [])));
  // The closing question (older chats stored it as a clarify card).
  const ask = msg.ask ?? msg.clarify;

  return (
    <div className="flex flex-col gap-4">
      {(nothingYet || current) && (
        <div className="inline-flex items-center gap-2 text-sm text-ink-soft" aria-live="polite">
          <Loader2 size={14} className="animate-spin text-accent" /> {current?.label ?? "Thinking…"}
        </div>
      )}

      {msg.personalized.length > 0 && (
        <span className="inline-flex w-fit items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-xs text-accent" title={msg.personalized.join(" · ")}>
          <Sparkles size={12} /> Personalized: {msg.personalized.join(" · ")}
        </span>
      )}

      <RichText text={msg.intro} onRef={onRef} refLabel={refLabel} className="text-[15px]" />

      {msg.sections.map((s) => (
        <section key={s.id}>
          <div className="mb-2 flex items-end justify-between gap-3">
            <div>
              <h3 className="font-display text-lg leading-tight">{s.title}</h3>
              {s.why && <p className="text-sm text-ink-soft">{s.why}</p>}
              {s.relaxedNote && (
                <p className="mt-1 inline-flex items-center gap-1 text-xs text-ink-faint">
                  <Info size={12} /> {s.relaxedNote}
                </p>
              )}
            </div>
            {s.loaded && s.intent && s.products.length > 0 && (
              <button type="button" onClick={() => onSeeAll(s)} className="inline-flex shrink-0 items-center gap-1 text-sm text-ink-soft hover:text-ink">
                See all <ChevronRight size={14} />
              </button>
            )}
          </div>
          <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1">
            {s.loaded
              ? s.products
                  .filter((p) => !hidden.has(p.id))
                  .map((p, i) => <ProductCard key={p.id} p={p} index={i} compact refNo={p.ref} onOpen={onOpen} onMoreLike={onMoreLike} />)
              : Array.from({ length: 5 }).map((_, i) => <ProductSkeleton key={i} compact />)}
            {s.loaded && s.products.length === 0 && <p className="py-6 text-sm text-ink-soft">Nothing suitable in stock for this one.</p>}
          </div>
        </section>
      ))}

      {msg.picks && msg.picks.length > 0 && <PicksBlock picks={msg.picks} cards={cards} onOpen={onOpen} />}

      <RichText text={msg.answer} onRef={onRef} refLabel={refLabel} className="text-[15px]" />
      {msg.compare && <CompareBlock data={msg.compare} onOpen={onOpen} />}
      <RichText text={msg.outro} onRef={onRef} refLabel={refLabel} className="text-[15px]" />

      {msg.status === "error" && (
        <div className="flex items-center gap-3 rounded-xl border border-warn/30 bg-warn/5 px-3 py-2 text-sm text-warn">
          {msg.error ?? "Something went wrong."}
          <button onClick={onRetry} className="ml-auto inline-flex items-center gap-1 rounded-full border border-warn/40 px-3 py-1 hover:bg-warn/10">
            <RotateCcw size={13} /> Retry
          </button>
        </div>
      )}

      {ask && (
        <div className="flex flex-col gap-2">
          <p className="text-[15px] leading-relaxed">{ask.question}</p>
          {isLast && !running && ask.options.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {ask.options.map((o) => (
                <button key={o} onClick={() => onSend(o)} className="rounded-full border border-ink/30 bg-paper px-3 py-1.5 text-sm hover:border-ink">
                  {o}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {isLast && !running && !ask && msg.followups.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {msg.followups.map((f) => (
            <button key={f} onClick={() => onSend(f)} className="rounded-full border border-line bg-paper px-3 py-1.5 text-sm hover:border-ink">
              {f}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
