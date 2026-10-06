"use client";

import { ArrowRight, Clock, Loader2, MessageCircle, MessageSquare, MoreHorizontal, RotateCcw, Sparkles, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RichText } from "@/components/chat/RichText";
import { shortName } from "@/components/chat/ChatView";
import { CompareBlock } from "@/components/compare/CompareBlock";
import { ProductImage } from "@/components/product/ProductImage";
import { Loader } from "@/components/shopify/aura/Loader";
import { Composer, Sheet, useHydrated, type ComposerHandle } from "@/components/shopify/aura/ui";
import type { ProductCard } from "@/lib/agent/types";
import { FEATURES } from "@/lib/config";
import { sendChatMessage, stopChat } from "@/lib/chatClient";
import { useChats, type AssistantMessage, type Chat, type ChatSection } from "@/store/chats";
import { useSession } from "@/store/session";
import type { PlusMode } from "./mode";
import { PlusProduct } from "./PlusProduct";
import { PlusActionsContext, PlusSkeleton, PlusTile, type PlusActions } from "./PlusTile";

/** Every product the chat knows (its result sets plus pinned ones), by ref. */
function cardsByRef(chat: Chat): Map<number, ProductCard> {
  const out = new Map<number, ProductCard>();
  for (const p of chat.pinned ?? []) if (p.ref != null) out.set(p.ref, p);
  for (const m of chat.messages) {
    if (m.role !== "assistant") continue;
    for (const s of m.sections) for (const p of s.products) if (p.ref != null) out.set(p.ref, p);
    for (const p of m.compare?.products ?? []) if (p.ref != null && !out.has(p.ref)) out.set(p.ref, p);
  }
  return out;
}

/** Loader stage from the running turn's steps: thinking → searching → results. */
function stageOf(m: AssistantMessage | undefined): 0 | 1 | 2 | 3 {
  if (!m) return 0;
  if (m.sections.some((s) => s.loaded && s.products.length)) return 3;
  const running = m.steps.find((s) => s.status === "running");
  if (running?.id === "search") return 2;
  return m.steps.length ? 1 : 0;
}

/** A result set in the chat: three thumbnails + "View Results". */
function ResultCard({ s, active, onView }: { s: ChatSection; active: boolean; onView: () => void }) {
  return (
    <button
      type="button"
      onClick={onView}
      disabled={!s.loaded || !s.products.length}
      className={`flex w-full items-center gap-2 border bg-paper p-2.5 text-left shadow-sm transition hover:shadow-md disabled:cursor-default ${active ? "border-ink" : "border-line"}`}
    >
      {(s.loaded ? s.products.slice(0, 3) : [null, null, null]).map((p, i) =>
        p ? <ProductImage key={p.id} src={p.image} alt={p.title} className="aspect-[3/4] w-[22%] shrink-0" /> : <div key={i} className="skeleton aspect-[3/4] w-[22%] shrink-0" />,
      )}
      <span className="ml-auto flex shrink-0 flex-col items-end gap-0.5 pr-1 text-right">
        <span className="max-w-28 truncate text-xs text-ink-soft">{s.title}</span>
        <span className="inline-flex items-center gap-1.5 text-sm font-medium">
          {s.loaded ? (s.products.length ? "View Results" : "No results") : "Searching"} {s.loaded && s.products.length > 0 && <ArrowRight size={15} />}
        </span>
      </span>
    </button>
  );
}

/** The live grid for one result set: the chat's picks first, then the same filters' longer list as you scroll. */
function ResultsGrid({ s, hidden, mixShopify }: { s: ChatSection; hidden: Set<string>; mixShopify: boolean }) {
  const [more, setMore] = useState<ProductCard[] | null>(null);
  const [shown, setShown] = useState(16);
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!s.intent) return;
    let live = true;
    // Blend search: one server list of exact matches from both sources, already ranked (lib/relevance.ts).
    const req = mixShopify
      ? fetch("/api/blend/section", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ intent: s.intent, anchor: s.anchor ?? null, categories: s.intent.categories.include }),
        })
      : fetch("/api/chat/section", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ intent: s.intent }) });
    req
      .then((r) => (r.ok ? r.json() : { products: [] }))
      .then((j: { products: ProductCard[] }) => live && setMore(j.products ?? []))
      .catch(() => live && setMore([]));
    return () => {
      live = false;
    };
  }, [s.intent, s.anchor, mixShopify]);

  const seen = new Set<string>();
  const all = [...s.products, ...(more ?? [])].filter((p) => !hidden.has(p.id) && !seen.has(p.id) && (seen.add(p.id), true));
  const visible = all.slice(0, shown);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver((e) => e.some((x) => x.isIntersecting) && setShown((n) => (n < all.length ? n + 12 : n)), { rootMargin: "600px" });
    io.observe(el);
    return () => io.disconnect();
  });

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="font-display text-2xl tracking-tight">{s.title}</h2>
        {s.why && <p className="text-sm text-ink-soft">{s.why}</p>}
      </div>
      {s.relaxedNote && <p className="mb-4 text-xs text-ink-faint">{s.relaxedNote}</p>}
      {all.length === 0 && more !== null && <p className="py-16 text-center text-ink-soft">{s.emptyNote ?? "Nothing suitable in stock for this one."}</p>}
      <div className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 xl:grid-cols-4">
        {visible.map((p, i) => (
          <PlusTile key={p.id} p={p} index={i} />
        ))}
        {all.length === 0 && more === null && Array.from({ length: 8 }, (_, i) => <PlusSkeleton key={i} />)}
      </div>
      <div ref={sentinel} className="flex h-16 items-center justify-center">
        {more === null && all.length > 0 && <Loader2 size={18} className="animate-spin text-ink-faint" />}
      </div>
    </div>
  );
}

function AssistantTurn({
  m,
  isLast,
  active,
  onView,
  onRef,
  refLabel,
  onSend,
  onRetry,
  onOpen,
}: {
  m: AssistantMessage;
  isLast: boolean;
  active: string | null;
  onView: (id: string) => void;
  onRef: (ref: number) => void;
  refLabel: (ref: number) => string | undefined;
  onSend: (t: string) => void;
  onRetry: () => void;
  onOpen: (p: ProductCard) => void;
}) {
  const running = m.status === "streaming";
  const current = m.steps.find((s) => s.status === "running");
  const ask = m.ask ?? m.clarify;
  return (
    <div className="flex flex-col gap-3 text-[15px]">
      <RichText text={m.intro} onRef={onRef} refLabel={refLabel} />
      {m.sections.map((s) => (
        <div key={s.id}>
          <ResultCard s={s} active={s.id === active} onView={() => onView(s.id)} />
          {s.loaded && s.emptyNote && <p className="mt-1.5 text-sm text-ink-soft">{s.emptyNote}</p>}
        </div>
      ))}
      <RichText text={m.answer} onRef={onRef} refLabel={refLabel} />
      {m.compare && <CompareBlock data={m.compare} onOpen={onOpen} />}
      <RichText text={m.outro} onRef={onRef} refLabel={refLabel} />
      {running && (
        <div className="inline-flex items-center gap-2 text-sm text-ink-soft" aria-live="polite">
          <Loader2 size={14} className="animate-spin" /> {current?.label ?? "Thinking"}
        </div>
      )}
      {m.status === "error" && (
        <div className="flex items-center gap-3 border border-warn/30 bg-warn/5 px-3 py-2 text-sm text-warn">
          {m.error ?? "Something went wrong."}
          <button onClick={onRetry} className="ml-auto inline-flex items-center gap-1 rounded-full border border-warn/40 px-3 py-1 hover:bg-warn/10">
            <RotateCcw size={13} /> Retry
          </button>
        </div>
      )}
      {ask && (
        <div className="flex flex-col gap-2">
          <p className="leading-relaxed">{ask.question}</p>
          {FEATURES.answerPills && isLast && !running && ask.options.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {ask.options.map((o) => (
                <button key={o} onClick={() => onSend(o)} className="border border-line bg-paper px-3 py-1.5 text-sm hover:border-ink">
                  {o}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      {FEATURES.answerPills && isLast && !running && !ask && m.followups.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {m.followups.map((f) => (
            <button key={f} onClick={() => onSend(f)} className="border border-line bg-paper px-3 py-1.5 text-sm hover:border-ink">
              {f}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Aura++ search view: Drape's Typesense chat engine with Aura's layout (chat left, live results right). */
export function PlusSearch({ id, mode }: { id: string; mode: PlusMode }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const chat = useChats((s) => s.chats[id]);
  const order = useChats((s) => s.order);
  const chats = useChats((s) => s.chats);
  const disliked = useSession((s) => s.signals.disliked);
  const hidden = useMemo(() => new Set(disliked.map((d) => d.p.id)), [disliked]);
  const [quick, setQuick] = useState<ProductCard | null>(null);
  const [history, setHistory] = useState(false);
  const [menu, setMenu] = useState(false);
  const [tab, setTab] = useState<"chat" | "results">("chat");
  const [picked, setPicked] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ text: string; n: number } | null>(null);
  const composer = useRef<ComposerHandle>(null);
  const scroller = useRef<HTMLDivElement>(null);

  const refs = useMemo(() => (chat ? cardsByRef(chat) : new Map<number, ProductCard>()), [chat]);
  const send = useCallback(
    (text: string, refList?: number[]) => {
      setPicked(null);
      void sendChatMessage(id, text, refList?.length ? { refs: refList } : {});
    },
    [id],
  );

  useEffect(() => {
    if (draft) composer.current?.insert(draft.text);
  }, [draft]);
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [chat?.messages]);

  const actions = useMemo<PlusActions>(
    () => ({
      onOpen: setQuick,
      onAsk: (p, q) => {
        setQuick(null);
        const ref = useChats.getState().pin(id, p);
        if (q) return send(`About ${shortName(p)}: ${q}`, [ref]);
        setTab("chat");
        const text = `About ${shortName(p)}: `;
        setDraft((d) => ({ text, n: (d?.n ?? 0) + 1 }));
      },
      onMoreLike: (p) => {
        setQuick(null);
        const ref = useChats.getState().pin(id, p);
        send(`More like this: ${shortName(p)}`, [ref]);
      },
      showSource: mode.blend,
    }),
    [id, mode.blend, send],
  );

  // The newest answer that brought products. When a new one lands, phones switch to the results tab (a reply
  // that only asks a question stays in the chat); desktop viewers of older results get a "New results" pill.
  const latestResultsId =
    [...(chat?.messages ?? [])].reverse().find((m) => m.role === "assistant" && m.sections.some((s) => s.loaded && s.products.length))?.id ?? null;
  const [seenResultsId, setSeenResultsId] = useState(latestResultsId);
  if (latestResultsId !== seenResultsId) {
    setSeenResultsId(latestResultsId);
    setTab("results");
  }
  const mainRef = useRef<HTMLElement>(null);

  if (!hydrated) return <div className="h-[calc(100dvh-3.5rem)]" />;
  if (!chat) {
    return (
      <div className="mx-auto max-w-md p-10 text-center">
        <p className="font-display text-2xl">This chat isn&apos;t here.</p>
        <p className="mt-2 text-ink-soft">Chats are saved in this browser only.</p>
        <Link href={mode.base} className="mt-5 inline-block bg-ink px-5 py-2 text-sm text-canvas">
          Start a new search
        </Link>
      </div>
    );
  }

  const assistants = chat.messages.filter((m): m is AssistantMessage => m.role === "assistant");
  const last = assistants[assistants.length - 1];
  const lastUser = [...chat.messages].reverse().find((m) => m.role === "user");
  const running = last?.status === "streaming";
  const sections = assistants.flatMap((m) => m.sections);
  const newest = [...sections].reverse().find((s) => s.loaded && s.products.length);
  const active = sections.find((s) => s.id === picked) ?? newest ?? null;
  const showLoader = running && stageOf(last) < 3;
  const latestResults = assistants.find((m) => m.id === latestResultsId);
  const viewingOld = !!active && !!latestResults && !latestResults.sections.some((x) => x.id === active.id);
  // Pending "ask about" text typed into the composer; the user may still be editing a product mention.
  const pendingRefs = (text: string) => [...refs.values()].filter((p) => p.ref != null && text.includes(shortName(p))).map((p) => p.ref!);

  return (
    <PlusActionsContext.Provider value={actions}>
      <div className="flex h-[calc(100dvh-3.5rem)] flex-col md:flex-row md:gap-5 md:p-4">
        <div className="flex border-b border-line md:hidden">
          {(["chat", "results"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`flex-1 py-2.5 text-sm capitalize ${tab === t ? "border-b-2 border-ink font-medium" : "text-ink-soft"}`}>
              {t}
            </button>
          ))}
        </div>

        <aside className={`min-h-0 flex-1 flex-col bg-paper md:flex md:w-[420px] md:flex-none md:shadow-[0_8px_40px_rgba(0,0,0,0.08)] ${tab === "chat" ? "flex" : "hidden"}`}>
          <div className="flex items-center gap-2.5 bg-ink px-4 py-3 text-canvas">
            <Sparkles size={17} />
            <h2 className="flex-1 font-medium">{mode.title}</h2>
            <button onClick={() => router.push(mode.base)} className="rounded-full p-1 hover:bg-white/10" aria-label="Close chat">
              <X size={18} />
            </button>
          </div>
          <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            <div className="flex flex-col gap-5">
              {chat.messages.map((m) =>
                m.role === "user" ? (
                  <div key={m.id} className="flex justify-end">
                    <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl bg-sand px-4 py-2.5 text-[15px]">{m.text}</div>
                  </div>
                ) : (
                  <AssistantTurn
                    key={m.id}
                    m={m}
                    isLast={m.id === last?.id}
                    active={active?.id ?? null}
                    onView={(sid) => {
                      setPicked(sid);
                      setTab("results");
                    }}
                    onRef={(n) => setQuick(refs.get(n) ?? null)}
                    refLabel={(n) => {
                      const p = refs.get(n);
                      return p ? shortName(p) : undefined;
                    }}
                    onSend={(t) => send(t)}
                    onRetry={() => lastUser?.role === "user" && send(lastUser.text, lastUser.refs)}
                    onOpen={setQuick}
                  />
                ),
              )}
            </div>
          </div>
          <div className="space-y-3 border-t border-line px-4 py-3">
            <div className="flex items-center">
              {chat.chips.length > 0 && (
                <div className="no-scrollbar flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto text-xs">
                  <span className="shrink-0 text-ink-faint">Remembering</span>
                  {chat.chips.map((c) => (
                    <span key={c.key} className="shrink-0 rounded-full border border-line px-2.5 py-0.5">
                      {c.label}
                    </span>
                  ))}
                </div>
              )}
              <div className="relative ml-auto">
                <button onClick={() => setMenu((x) => !x)} className="rounded-full border border-line p-2 hover:border-ink" aria-label="More" aria-expanded={menu}>
                  <MoreHorizontal size={16} />
                </button>
                {menu && (
                  <div className="absolute bottom-11 right-0 z-20 w-44 border border-line bg-paper p-1 shadow-lg" role="menu">
                    <button role="menuitem" onClick={() => router.push(mode.base)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-sand">
                      <MessageCircle size={15} /> New Chat
                    </button>
                    <button role="menuitem" onClick={() => (setMenu(false), setHistory(true))} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-sand">
                      <Clock size={15} /> History
                    </button>
                  </div>
                )}
              </div>
            </div>
            <Composer ref={composer} onSend={(t) => send(t, pendingRefs(t))} onStop={() => stopChat(id)} running={running} placeholder="Ask follow up…" />
          </div>
        </aside>

        <main ref={mainRef} className={`relative min-h-0 flex-1 overflow-y-auto px-4 pb-10 pt-4 md:block md:px-2 md:pt-0 ${tab === "results" ? "block" : "hidden"}`}>
          {viewingOld && !showLoader && (
            <div className="sticky top-2 z-10 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  setPicked(null);
                  mainRef.current?.scrollTo({ top: 0 });
                }}
                className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-sm font-medium text-canvas shadow-lg hover:bg-ink/90"
              >
                <Sparkles size={14} /> View new results
              </button>
            </div>
          )}
          {showLoader ? (
            <Loader key={last?.id} startedAt={last?.at ?? 0} stage={stageOf(last)} activity={last?.steps.find((s) => s.status === "running")?.label ?? null} />
          ) : active ? (
            <ResultsGrid key={active.id} s={active} hidden={hidden} mixShopify={mode.blend} />
          ) : last?.sections.some((s) => s.emptyNote) ? (
            <div className="py-24 text-center text-ink-soft">
              {last.sections.filter((s) => s.emptyNote).map((s) => (
                <p key={s.id}>{s.emptyNote}</p>
              ))}
            </div>
          ) : (
            <p className="py-24 text-center text-ink-soft">Your results will appear here.</p>
          )}
        </main>
      </div>

      <Sheet open={!!quick} onClose={() => setQuick(null)} title={quick?.brand ?? "Product"}>
        {quick && <PlusProduct key={quick.id} p={quick} onOpen={setQuick} onAsk={(p) => actions.onAsk?.(p, null)} onMoreLike={actions.onMoreLike} showSource={mode.blend} />}
      </Sheet>

      <Sheet open={history} onClose={() => setHistory(false)} title="History">
        <ul className="p-3">
          {order
            .map((cid) => chats[cid])
            .filter((c) => c && c.surface === mode.surface && c.messages.length)
            .map((c) => (
              <li key={c.id} className={`group flex items-center gap-2 rounded-lg px-3 py-2.5 ${c.id === id ? "bg-sand" : "hover:bg-sand/60"}`}>
                <MessageSquare size={15} className="shrink-0 text-ink-faint" />
                <Link href={`${mode.base}/c/${c.id}`} onClick={() => setHistory(false)} className="min-w-0 flex-1 truncate text-sm">
                  {c.title}
                </Link>
                <button onClick={() => useChats.getState().deleteChat(c.id)} className="hidden text-ink-faint hover:text-warn group-hover:block" aria-label={`Delete ${c.title}`}>
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
        </ul>
      </Sheet>
    </PlusActionsContext.Provider>
  );
}
