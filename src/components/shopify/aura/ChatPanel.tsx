"use client";

import { ArrowRight, Clock, Loader2, MessageCircle, MoreHorizontal, RotateCcw, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ShopifyImage } from "@/components/shopify/ShopifyCard";
import { plainMentions, type AuraAssistantMsg, type AuraChat, type SectionBlock } from "@/lib/shopify/aura/store";
import type { Country } from "@/lib/shopify/countries";
import type { ShopifyCard } from "@/lib/shopify/types";
import { CompareBlock } from "./CompareBlock";
import { RichText } from "./RichText";
import { Composer, type ComposerHandle } from "./ui";

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
        p ? <ShopifyImage key={p.id} src={p.image} alt={p.title} className="aspect-[3/4] w-[22%] shrink-0" /> : <div key={i} className="skeleton aspect-[3/4] w-[22%] shrink-0" />,
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
  }, [chat.messages]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-paper">
      <div className="flex items-center gap-2.5 bg-ink px-4 py-3 text-canvas">
        <Sparkles size={17} />
        <h2 className="flex-1 font-medium">Ask Aura</h2>
        <button onClick={onClose} className="rounded-full p-1 hover:bg-white/10" aria-label="Close chat">
          <X size={18} />
        </button>
      </div>

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
    </div>
  );
}
