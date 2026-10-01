"use client";

import { ArrowRight, Clock, Loader2, MessageCircle, MoreHorizontal, Ruler, RotateCcw, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ShopifyImage } from "@/components/shopify/ShopifyCard";
import { plainMentions, useAura, type AuraAssistantMsg, type AuraChat, type SectionBlock } from "@/lib/shopify/aura/store";
import type { Country } from "@/lib/shopify/countries";
import type { ShopifyCard } from "@/lib/shopify/types";
import { CompareBlock } from "./CompareBlock";
import { RichText } from "./RichText";
import { SmartFilters } from "./SmartFilters";
import { Composer, type ComposerHandle } from "./ui";

const SIZE_CHOICES = ["XS", "S", "M", "L", "XL", "XXL", "26", "28", "30", "32", "34", "36", "5", "6", "7", "8", "9", "10"];

/** A result set in the chat: three thumbnails + "View Results" (switches the grid to it). */
function ResultCard({ block, active, onView }: { block: SectionBlock; active: boolean; onView: () => void }) {
  return (
    <button
      type="button"
      onClick={onView}
      disabled={!block.loaded || !block.products.length}
      className={`flex w-full items-center gap-2 border bg-paper p-2.5 text-left shadow-sm transition hover:shadow-md disabled:cursor-default ${active ? "border-ink" : "border-line"}`}
    >
      {(block.loaded ? block.products.slice(0, 3) : [null, null, null]).map((p, i) =>
        p ? (
          <ShopifyImage key={p.id} src={p.image} alt={p.title} className="aspect-[3/4] w-[22%] shrink-0" />
        ) : (
          <div key={i} className="skeleton aspect-[3/4] w-[22%] shrink-0" />
        ),
      )}
      <span className="ml-auto inline-flex shrink-0 items-center gap-1.5 pr-1 text-sm font-medium">
        {block.loaded ? (block.products.length ? "View Results" : "No results") : "Searching"} {block.loaded && block.products.length > 0 && <ArrowRight size={15} />}
      </span>
    </button>
  );
}

function AssistantTurn({
  msg,
  isLast,
  country,
  activeSection,
  onViewResults,
  onRef,
  card,
  onSend,
  onRetry,
}: {
  msg: AuraAssistantMsg;
  isLast: boolean;
  country: Country;
  activeSection: string | null;
  onViewResults: (id: string) => void;
  onRef: (ref: number) => void;
  card: (ref: number) => ShopifyCard | undefined;
  onSend: (t: string) => void;
  onRetry: () => void;
}) {
  const running = msg.status === "streaming";
  return (
    <div className="flex flex-col gap-3">
      {msg.blocks.map((b, i) =>
        b.kind === "text" ? (
          <RichText key={i} text={b.text} onRef={onRef} card={card} country={country} />
        ) : b.kind === "section" ? (
          <ResultCard key={b.id} block={b} active={b.id === activeSection} onView={() => onViewResults(b.id)} />
        ) : (
          <CompareBlock key={i} items={b.items} focus={b.focus} country={country} onOpen={onRef} />
        ),
      )}
      {running && (
        <div className="inline-flex items-center gap-2 text-sm text-ink-soft" aria-live="polite">
          <Loader2 size={14} className="animate-spin" /> {msg.activity && msg.activity !== "Thinking…" ? msg.activity : "Thinking"}
        </div>
      )}
      {msg.status === "error" && (
        <div className="flex items-center gap-3 border border-warn/30 bg-warn/5 px-3 py-2 text-sm text-warn">
          {msg.error ?? "Something went wrong."}
          <button onClick={onRetry} className="ml-auto inline-flex items-center gap-1 rounded-full border border-warn/40 px-3 py-1 hover:bg-warn/10">
            <RotateCcw size={13} /> Retry
          </button>
        </div>
      )}
      {isLast && !running && msg.followups.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {msg.followups.map((f) => (
            <button key={f} onClick={() => onSend(f)} className="border border-line bg-paper px-3 py-1.5 text-sm hover:border-ink">
              {f}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** "In my size": a toggle plus a small editor for the sizes it filters to. */
function InMySize() {
  const sizes = useAura((s) => s.sizes);
  const on = useAura((s) => s.inMySize);
  const { setSizes, setInMySize } = useAura.getState();
  const [edit, setEdit] = useState(false);
  return (
    <div className="relative flex items-center gap-2 text-sm">
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={() => (sizes.length ? setInMySize(!on) : setEdit(true))}
        className={`relative h-5 w-9 rounded-full transition ${on ? "bg-ink" : "bg-line"}`}
        aria-label="In my size"
      >
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${on ? "left-[18px]" : "left-0.5"}`} />
      </button>
      <button type="button" onClick={() => setEdit((e) => !e)} className="inline-flex items-center gap-1 text-ink-soft hover:text-ink">
        In My Size{sizes.length ? <span className="text-xs text-ink-faint">({sizes.join(", ")})</span> : <Ruler size={13} />}
      </button>
      {edit && (
        <div className="absolute bottom-9 left-0 z-20 w-72 border border-line bg-paper p-3 shadow-lg">
          <p className="text-xs text-ink-soft">Pick your sizes (clothing, waist, shoe). Results keep only products in stock in them.</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {SIZE_CHOICES.map((s) => {
              const sel = sizes.includes(s);
              return (
                <button key={s} onClick={() => setSizes(sel ? sizes.filter((x) => x !== s) : [...sizes, s])} className={`min-w-9 border px-2 py-1 text-xs ${sel ? "border-ink bg-ink text-canvas" : "border-line hover:border-ink"}`}>
                  {s}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex justify-end gap-3 text-sm">
            <button
              onClick={() => {
                setEdit(false);
                if (sizes.length) setInMySize(true);
              }}
              className="bg-ink px-3 py-1.5 text-canvas"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function ChatPanel({
  chat,
  country,
  running,
  draft,
  card,
  onSend,
  onStop,
  onRef,
  onViewResults,
  onNewChat,
  onHistory,
  onClose,
}: {
  chat: AuraChat;
  country: Country;
  running: boolean;
  /** Text to insert into the composer (e.g. "About [product]: "). */
  draft: { text: string; n: number } | null;
  card: (ref: number) => ShopifyCard | undefined;
  onSend: (t: string) => void;
  onStop: () => void;
  onRef: (ref: number) => void;
  onViewResults: (sectionId: string) => void;
  onNewChat: () => void;
  onHistory: () => void;
  onClose: () => void;
}) {
  const [filters, setFilters] = useState(false);
  const [menu, setMenu] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const stick = useRef(true);
  const composer = useRef<ComposerHandle>(null);

  useEffect(() => {
    if (draft) composer.current?.insert(draft.text);
  }, [draft]);
  const lastAssistant = [...chat.messages].reverse().find((m) => m.role === "assistant");
  const lastUser = [...chat.messages].reverse().find((m) => m.role === "user");

  useEffect(() => {
    const el = scroller.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [chat.messages, filters]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-paper">
      <div className="flex items-center gap-2.5 bg-ink px-4 py-3 text-canvas">
        <Sparkles size={17} />
        <h2 className="flex-1 font-medium">Ask Aura</h2>
        <button onClick={onClose} className="rounded-full p-1 hover:bg-white/10" aria-label="Close chat">
          <X size={18} />
        </button>
      </div>

      {filters ? (
        <SmartFilters
          country={country}
          refinements={chat.refinements}
          onBack={() => setFilters(false)}
          onApply={(m) => {
            setFilters(false);
            onSend(m);
          }}
        />
      ) : (
        <>
          <div
            ref={scroller}
            onScroll={(e) => {
              const el = e.currentTarget;
              stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
            }}
            className="min-h-0 flex-1 overflow-y-auto px-4 py-4"
          >
            <div className="flex flex-col gap-5">
              {chat.messages.map((m) =>
                m.role === "user" ? (
                  <div key={m.id} className="flex justify-end">
                    <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl bg-sand px-4 py-2.5 text-[15px]">{plainMentions(m.text)}</div>
                  </div>
                ) : (
                  <AssistantTurn
                    key={m.id}
                    msg={m}
                    isLast={m.id === lastAssistant?.id}
                    country={country}
                    activeSection={chat.activeSection}
                    onViewResults={onViewResults}
                    onRef={onRef}
                    card={card}
                    onSend={onSend}
                    onRetry={() => lastUser?.role === "user" && onSend(lastUser.text)}
                  />
                ),
              )}
            </div>
          </div>

          {chat.chips.length > 0 && (
            <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto border-t border-line px-4 pt-2.5 text-xs">
              <span className="shrink-0 text-ink-faint">Remembering</span>
              {chat.chips.map((c) => (
                <span key={c} className="inline-flex shrink-0 items-center gap-1 rounded-full border border-line py-0.5 pl-2.5 pr-1">
                  {c}
                  <button onClick={() => onSend(`Drop "${c}"`)} disabled={running} className="rounded-full p-0.5 opacity-60 hover:opacity-100" aria-label={`Drop ${c}`}>
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="space-y-3 border-t border-line px-4 py-3">
            <div className="flex items-center gap-3">
              <button onClick={() => setFilters(true)} disabled={running} className="border border-line px-3.5 py-2 text-sm font-medium hover:border-ink disabled:opacity-50">
                Smart Filters
              </button>
              <InMySize />
              <div className="relative ml-auto">
                <button onClick={() => setMenu((m) => !m)} className="rounded-full border border-line p-2 hover:border-ink" aria-label="More" aria-expanded={menu}>
                  <MoreHorizontal size={16} />
                </button>
                {menu && (
                  <div className="absolute bottom-11 right-0 z-20 w-44 border border-line bg-paper p-1 shadow-lg" role="menu">
                    <button role="menuitem" onClick={() => (setMenu(false), onNewChat())} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-sand">
                      <MessageCircle size={15} /> New Chat
                    </button>
                    <button role="menuitem" onClick={() => (setMenu(false), onHistory())} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-sand">
                      <Clock size={15} /> History
                    </button>
                  </div>
                )}
              </div>
            </div>
            <Composer ref={composer} onSend={onSend} onStop={onStop} running={running} placeholder="Ask follow up…" />
          </div>
        </>
      )}
    </div>
  );
}
