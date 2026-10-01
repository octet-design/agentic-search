"use client";

import { MessageSquare, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { ProductDetail } from "@/components/shopify/ProductDetail";
import { sendAuraMessage, stopAura } from "@/lib/shopify/aura/send";
import { cardsByRef, useAura, type SectionBlock } from "@/lib/shopify/aura/store";
import { track } from "@/lib/shopify/aura/taste";
import { getCountry } from "@/lib/shopify/countries";
import type { ShopifyCard } from "@/lib/shopify/types";
import { ChatPanel } from "./ChatPanel";
import { Loader } from "./Loader";
import { TileActionsContext, type TileActions } from "./ProductTile";
import { ResultsGrid } from "./ResultsGrid";
import { Sheet, useHydrated } from "./ui";

const short = (t: string) => (t.length > 40 ? `${t.slice(0, 38).trimEnd()}…` : t).replace(/[[\]]/g, "");

/** Which stage the loader shows for the running turn: thinking → searching → results. */
function stageOf(activity: string | null, hasResults: boolean): 0 | 1 | 2 | 3 {
  if (hasResults) return 3;
  if (!activity) return 0;
  return /search|finding|comparing|checking/i.test(activity) ? 2 : 1;
}

/** Aura's search view: chat on the left, live results on the right (Plush-style). */
export function AuraSearch({ id }: { id: string }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const chat = useAura((s) => s.chats[id]);
  const order = useAura((s) => s.order);
  const chats = useAura((s) => s.chats);
  const [quick, setQuick] = useState<ShopifyCard | null>(null);
  const [history, setHistory] = useState(false);
  const [tab, setTab] = useState<"chat" | "results">("chat");
  // Text to drop into the composer ("About [product]: "); n changes so the same text can be inserted twice.
  const [draft, setDraft] = useState<{ text: string; n: number } | null>(null);

  const refs = useMemo(() => (chat ? cardsByRef(chat) : new Map<number, ShopifyCard>()), [chat]);
  const hidden = useMemo(() => new Set(chat?.hidden.map((h) => h.id) ?? []), [chat?.hidden]);
  const send = useCallback(
    (text: string) => {
      setTab("results");
      void sendAuraMessage(id, text);
    },
    [id],
  );
  const mention = useCallback((p: ShopifyCard) => `[${short(p.title)}](#${useAura.getState().pin(id, p)})`, [id]);

  const actions = useMemo<TileActions | null>(
    () =>
      chat
        ? {
            country: getCountry(chat.country),
            onOpen: setQuick,
            onAsk: (p, q) => {
              setQuick(null);
              if (q) return send(`About ${mention(p)}: ${q}`);
              setTab("chat");
              // Pin outside the state updater: updaters run during render and must not touch the store.
              const text = `About ${mention(p)}: `;
              setDraft((d) => ({ text, n: (d?.n ?? 0) + 1 }));
            },
            onMoreLike: (p) => {
              setQuick(null);
              send(`More like this: ${mention(p)}`);
            },
            onHide: (p, reason) => useAura.getState().hide(id, p, reason),
          }
        : null,
    [chat, id, mention, send],
  );

  if (!hydrated) return <div className="h-[calc(100dvh-3.5rem)]" />;
  if (!chat || !actions) {
    return (
      <div className="mx-auto max-w-md p-10 text-center">
        <p className="font-display text-2xl">This chat isn&apos;t here.</p>
        <p className="mt-2 text-ink-soft">Chats are saved in this browser only.</p>
        <Link href="/aura" className="mt-5 inline-block bg-ink px-5 py-2 text-sm text-canvas">
          Start a new search
        </Link>
      </div>
    );
  }

  const country = actions.country;
  const running = chat.messages.some((m) => m.role === "assistant" && m.status === "streaming");
  const turn = [...chat.messages].reverse().find((m) => m.role === "assistant");
  const turnHasResults = !!turn && turn.role === "assistant" && turn.blocks.some((b) => b.kind === "section" && b.loaded && b.products.length > 0);
  const sections = chat.messages.flatMap((m) => (m.role === "assistant" ? m.blocks.filter((b): b is SectionBlock => b.kind === "section") : []));
  const active = sections.find((s) => s.id === chat.activeSection) ?? null;
  const showLoader = running && !turnHasResults;
  const startedAt = (turn?.role === "assistant" && turn.at) || 0;

  return (
    <TileActionsContext.Provider value={actions}>
      <div className="flex h-[calc(100dvh-3.5rem)] flex-col md:flex-row md:gap-5 md:p-4">
        <div className="flex border-b border-line md:hidden">
          {(["chat", "results"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`flex-1 py-2.5 text-sm capitalize ${tab === t ? "border-b-2 border-ink font-medium" : "text-ink-soft"}`}>
              {t}
            </button>
          ))}
        </div>

        <aside className={`min-h-0 flex-1 md:block md:w-[420px] md:flex-none md:shadow-[0_8px_40px_rgba(0,0,0,0.08)] ${tab === "chat" ? "block" : "hidden"}`}>
          <ChatPanel
            chat={chat}
            country={country}
            running={running}
            draft={draft}
            card={(n) => refs.get(n)}
            onSend={send}
            onStop={() => stopAura(id)}
            onRef={(n) => setQuick(refs.get(n) ?? null)}
            onViewResults={(sid) => {
              track({ type: "view_results" });
              useAura.getState().setActiveSection(id, sid);
              setTab("results");
            }}
            onNewChat={() => router.push("/aura")}
            onHistory={() => setHistory(true)}
            onClose={() => router.push("/aura")}
          />
        </aside>

        <main className={`min-h-0 flex-1 overflow-y-auto px-4 pb-10 pt-4 md:block md:px-2 md:pt-0 ${tab === "results" ? "block" : "hidden"}`}>
          {showLoader ? (
            <Loader key={turn?.id} startedAt={startedAt} stage={stageOf(turn?.role === "assistant" ? turn.activity : null, false)} activity={turn?.role === "assistant" ? turn.activity : null} />
          ) : active ? (
            <ResultsGrid key={active.id} block={active} country={country} hidden={hidden} />
          ) : (
            <p className="py-24 text-center text-ink-soft">Your results will appear here.</p>
          )}
        </main>
      </div>

      <Sheet open={!!quick} onClose={() => setQuick(null)} title={quick?.seller ?? "Product"}>
        {quick && (
          <div>
            <ProductDetail key={quick.id} id={quick.id} country={country} preview={quick} layout="sheet" onOpenSimilar={setQuick} />
            <div className="sticky bottom-0 flex gap-2 border-t border-line bg-paper px-5 py-3">
              <button onClick={() => actions.onAsk?.(quick, null)} className="flex-1 border border-line px-3 py-2 text-sm hover:border-ink">
                Ask about this
              </button>
              <button onClick={() => actions.onMoreLike?.(quick)} className="flex-1 bg-ink px-3 py-2 text-sm text-canvas">
                More like this
              </button>
            </div>
          </div>
        )}
      </Sheet>

      <Sheet open={history} onClose={() => setHistory(false)} title="History">
        <ul className="p-3">
          {order
            .map((cid) => chats[cid])
            .filter((c) => c && c.messages.length)
            .map((c) => (
              <li key={c.id} className={`group flex items-center gap-2 rounded-lg px-3 py-2.5 ${c.id === id ? "bg-sand" : "hover:bg-sand/60"}`}>
                <MessageSquare size={15} className="shrink-0 text-ink-faint" />
                <Link href={`/aura/c/${c.id}`} onClick={() => setHistory(false)} className="min-w-0 flex-1 truncate text-sm">
                  {c.title}
                </Link>
                <span className="text-xs text-ink-faint">{getCountry(c.country).flag}</span>
                <button onClick={() => useAura.getState().deleteChat(c.id)} className="hidden text-ink-faint hover:text-warn group-hover:block" aria-label={`Delete ${c.title}`}>
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
        </ul>
      </Sheet>
    </TileActionsContext.Provider>
  );
}
