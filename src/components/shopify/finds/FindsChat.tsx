"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2, RotateCcw, Scale, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ProductDetail } from "@/components/shopify/ProductDetail";
import { sendFindsMessage, stopFinds } from "@/lib/shopify/chat/send";
import { plainMentions, useFinds, type FindsAssistantMsg, type FindsChat as Chat, type SectionBlock } from "@/lib/shopify/chat/store";
import { AUDIENCES } from "@/lib/shopify/config";
import { getCountry, type Country } from "@/lib/shopify/countries";
import type { ShopifyCard } from "@/lib/shopify/types";
import { CompareBlock } from "./CompareBlock";
import { FindsLayout } from "./FindsLayout";
import { CardActionsContext, ProductRow, type CardActions } from "./Products";
import { RichText } from "./RichText";
import { SeeAllBody } from "./SeeAllPanel";
import { Composer, Sheet, useHydrated } from "./ui";

/** Every card this chat has shown, by ref. */
function cardsByRef(chat: Chat): Map<number, ShopifyCard> {
  const out = new Map<number, ShopifyCard>();
  for (const m of chat.messages) {
    if (m.role !== "assistant") continue;
    for (const b of m.blocks) if (b.kind === "section") for (const p of b.products) if (p.ref != null) out.set(p.ref, p);
  }
  return out;
}

const shortName = (t: string) => (t.length > 42 ? `${t.slice(0, 40).trimEnd()}…` : t);
/** How a product is named in a message the app sends for the shopper (the model sees the ref). */
const mention = (p: ShopifyCard) => (p.ref != null ? `[${shortName(p.title).replace(/[[\]]/g, "")}](#${p.ref})` : shortName(p.title));

const MAX_COMPARE = 4;

function AssistantTurn({
  msg,
  isLast,
  country,
  hidden,
  onRef,
  card,
  onSeeAll,
  onSend,
  onRetry,
}: {
  msg: FindsAssistantMsg;
  isLast: boolean;
  country: Country;
  hidden: Set<string>;
  onRef: (ref: number) => void;
  card: (ref: number) => ShopifyCard | undefined;
  onSeeAll: (b: SectionBlock) => void;
  onSend: (t: string) => void;
  onRetry: () => void;
}) {
  const running = msg.status === "streaming";
  return (
    <div className="flex flex-col gap-5">
      {running && (
        <div className="inline-flex items-center gap-2 text-sm text-ink-soft" aria-live="polite">
          <Loader2 size={14} className="animate-spin text-accent" /> {msg.activity ?? "Thinking…"}
        </div>
      )}
      {msg.blocks.map((b, i) =>
        b.kind === "text" ? (
          <RichText key={i} text={b.text} onRef={onRef} card={card} country={country} />
        ) : b.kind === "section" ? (
          <ProductRow key={b.id} block={b} hidden={hidden} onSeeAll={onSeeAll} />
        ) : (
          <CompareBlock key={i} items={b.items} focus={b.focus} country={country} onOpen={onRef} />
        ),
      )}
      {msg.status === "error" && (
        <div className="flex items-center gap-3 rounded-xl border border-warn/30 bg-warn/5 px-3 py-2 text-sm text-warn">
          {msg.error ?? "Something went wrong."}
          <button onClick={onRetry} className="ml-auto inline-flex items-center gap-1 rounded-full border border-warn/40 px-3 py-1 hover:bg-warn/10">
            <RotateCcw size={13} /> Retry
          </button>
        </div>
      )}
      {isLast && !running && msg.followups.length > 0 && (
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

export function FindsChat({ id }: { id: string }) {
  const hydrated = useHydrated();
  const chat = useFinds((s) => s.chats[id]);
  const hide = useFinds((s) => s.hide);
  const [quick, setQuick] = useState<ShopifyCard | null>(null);
  const [seeAll, setSeeAll] = useState<SectionBlock | null>(null);
  const [compare, setCompare] = useState<ShopifyCard[]>([]);
  const scroller = useRef<HTMLDivElement>(null);
  const stick = useRef(true);

  const refs = useMemo(() => (chat ? cardsByRef(chat) : new Map<number, ShopifyCard>()), [chat]);
  const hidden = useMemo(() => new Set(chat?.hidden.map((h) => h.id) ?? []), [chat?.hidden]);
  const running = !!chat?.messages.some((m) => m.role === "assistant" && m.status === "streaming");
  const send = useCallback((text: string) => sendFindsMessage(id, text), [id]);
  const onRef = useCallback((n: number) => setQuick(refs.get(n) ?? null), [refs]);
  const card = useCallback((n: number) => refs.get(n), [refs]);

  // Follow new content while the user is at the bottom; don't yank them back if they scrolled up.
  useEffect(() => {
    const el = scroller.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [chat?.messages]);

  const actions = useMemo<CardActions | null>(() => {
    if (!chat) return null;
    return {
      country: getCountry(chat.country),
      onOpen: setQuick,
      onMoreLike: (p) => {
        setSeeAll(null);
        void send(`More like this: ${mention(p)}`);
      },
      onHide: (p, reason) => hide(id, p, reason),
      compare: {
        ids: compare.map((p) => p.id),
        max: MAX_COMPARE,
        toggle: (p) => setCompare((c) => (c.some((x) => x.id === p.id) ? c.filter((x) => x.id !== p.id) : c.length < MAX_COMPARE ? [...c, p] : c)),
      },
    };
  }, [chat, compare, hide, id, send]);

  if (!hydrated) return <FindsLayout activeId={id}>{null}</FindsLayout>;
  if (!chat || !actions) {
    return (
      <FindsLayout>
        <div className="m-auto max-w-md p-6 text-center">
          <p className="font-display text-2xl">This chat isn&apos;t here.</p>
          <p className="mt-2 text-ink-soft">Chats are saved in this browser only.</p>
          <Link href="/finds" className="mt-5 inline-block rounded-full bg-ink px-5 py-2 text-sm text-canvas">
            Start a new chat
          </Link>
        </div>
      </FindsLayout>
    );
  }

  const country = actions.country;
  const who = chat.audience ? AUDIENCES.find((a) => a.id === chat.audience)?.label : null;
  const lastAssistant = [...chat.messages].reverse().find((m) => m.role === "assistant");
  const lastUser = [...chat.messages].reverse().find((m) => m.role === "user");
  const comparable = compare.filter((p) => p.ref != null);

  return (
    <CardActionsContext.Provider value={actions}>
      <FindsLayout activeId={id} title={chat.title}>
        <div
          ref={scroller}
          onScroll={(e) => {
            const el = e.currentTarget;
            stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
          }}
          className="min-h-0 flex-1 overflow-y-auto"
        >
          <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 pb-8 pt-6 md:px-8 md:pt-8">
            {chat.messages.map((m) =>
              m.role === "user" ? (
                <div key={m.id} className="flex justify-end">
                  <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl bg-ink px-4 py-2.5 text-canvas">{plainMentions(m.text)}</div>
                </div>
              ) : (
                <AssistantTurn
                  key={m.id}
                  msg={m}
                  isLast={m.id === lastAssistant?.id}
                  country={country}
                  hidden={hidden}
                  onRef={onRef}
                  card={card}
                  onSeeAll={setSeeAll}
                  onSend={send}
                  onRetry={() => lastUser?.role === "user" && send(lastUser.text)}
                />
              ),
            )}
          </div>
        </div>

        <AnimatePresence>
          {compare.length > 0 && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="pointer-events-none absolute inset-x-0 bottom-28 z-10 flex justify-center px-4"
            >
              <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-line bg-paper py-1.5 pl-2 pr-1.5 shadow-lg">
                {compare.map((p) => (
                  <button key={p.id} onClick={() => actions.compare!.toggle(p)} className="inline-flex max-w-32 items-center gap-1 rounded-full bg-sand px-2 py-1 text-xs" aria-label={`Remove ${p.title}`}>
                    <span className="truncate">{shortName(p.title)}</span> <X size={11} />
                  </button>
                ))}
                <button
                  disabled={comparable.length < 2 || running}
                  onClick={() => {
                    void send(`Compare ${comparable.map(mention).join(" and ")}`);
                    setCompare([]);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-xs text-canvas disabled:opacity-40"
                >
                  <Scale size={13} /> Compare {compare.length}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="border-t border-line bg-canvas/95 px-4 pb-4 pt-3 backdrop-blur md:px-8">
          <div className="mx-auto max-w-4xl">
            {chat.chips.length > 0 && (
              <div className="no-scrollbar mb-2 flex items-center gap-1.5 overflow-x-auto text-xs">
                <span className="shrink-0 uppercase tracking-wide text-ink-faint">This chat remembers</span>
                {chat.chips.map((c) => (
                  <span key={c} className="inline-flex shrink-0 items-center gap-1 rounded-full border border-line bg-paper py-0.5 pl-2.5 pr-1">
                    {c}
                    <button
                      onClick={() => send(`Drop "${c}"`)}
                      disabled={running}
                      className="rounded-full p-0.5 opacity-60 hover:bg-black/5 hover:opacity-100"
                      aria-label={`Drop ${c}`}
                    >
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <p className="mb-2 text-xs text-ink-faint">
              {country.flag} Shopping in {country.name}
              {who ? ` · for ${who.toLowerCase()}` : ""} · prices in {country.currency} · checkout on each store&rsquo;s own site
            </p>
            <Composer onSend={send} onStop={() => stopFinds(id)} running={running} placeholder="Ask a follow-up, e.g. “under a lower budget” or “does it come in M?”" />
          </div>
        </div>

        <Sheet open={!!seeAll} onClose={() => setSeeAll(null)} title={seeAll?.title} wide>
          {seeAll && <SeeAllBody key={seeAll.id} block={seeAll} country={country} hidden={hidden} />}
        </Sheet>

        <Sheet open={!!quick} onClose={() => setQuick(null)} title={quick?.seller ?? "Product"}>
          {quick && (
            <ProductDetail
              key={quick.id}
              id={quick.id}
              country={country}
              preview={quick}
              layout="sheet"
              onOpenSimilar={setQuick}
            />
          )}
        </Sheet>
      </FindsLayout>
    </CardActionsContext.Provider>
  );
}
