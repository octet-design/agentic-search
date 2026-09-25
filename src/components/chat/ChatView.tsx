"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ProductDetails } from "@/components/product/ProductDetails";
import { Drawer } from "@/components/ui/Drawer";
import { useHydrated } from "@/hooks/useHydrated";
import type { ProductCard as Card } from "@/lib/agent/types";
import { sendChatMessage, stopChat } from "@/lib/chatClient";
import { useChats, type Chat } from "@/store/chats";
import { useSession } from "@/store/session";
import { AssistantMessage } from "./AssistantMessage";
import { ChatLayout } from "./ChatLayout";
import { Composer, type ComposerHandle } from "./Composer";

/** Every product card this chat has shown, by #ref (sections + compare blocks). */
function cardsByRef(chat: Chat): Map<number, Card> {
  const out = new Map<number, Card>();
  for (const m of chat.messages) {
    if (m.role !== "assistant") continue;
    for (const s of m.sections) for (const p of s.products) if (p.ref != null) out.set(p.ref, p);
    for (const p of m.compare?.products ?? []) if (p.ref != null && !out.has(p.ref)) out.set(p.ref, p);
  }
  return out;
}

export function ChatView({ id, debug = false }: { id: string; debug?: boolean }) {
  const hydrated = useHydrated();
  const chat = useChats((s) => s.chats[id]);
  const disliked = useSession((s) => s.signals.disliked);
  const hidden = useMemo(() => new Set(disliked.map((d) => d.p.id)), [disliked]);
  const [quick, setQuick] = useState<Card | null>(null);
  const composer = useRef<ComposerHandle>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const stick = useRef(true);

  const refs = useMemo(() => (chat ? cardsByRef(chat) : new Map<number, Card>()), [chat]);
  const running = !!chat?.messages.some((m) => m.role === "assistant" && m.status === "streaming");
  const send = useCallback((text: string) => sendChatMessage(id, text, { debug }), [id, debug]);

  // Follow new content while the user is at the bottom; don't yank them back if they scrolled up.
  useEffect(() => {
    const el = scroller.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [chat?.messages]);

  // The compare tray asks the chat to compare selected products (when they have refs here).
  useEffect(() => {
    const onCompare = (ev: Event) => {
      const ids = (ev as CustomEvent<string[]>).detail;
      const byId = new Map([...refs.values()].map((p) => [p.id, p.ref]));
      const nums = ids.map((x) => byId.get(x)).filter((n): n is number => n != null);
      if (nums.length >= 2) {
        ev.preventDefault();
        send(`Compare ${nums.map((n) => `#${n}`).join(" and ")}`);
      }
    };
    window.addEventListener("drape:compare", onCompare);
    return () => window.removeEventListener("drape:compare", onCompare);
  }, [refs, send]);

  if (!hydrated) return <ChatLayout activeId={id}>{null}</ChatLayout>;
  if (!chat) {
    return (
      <ChatLayout>
        <div className="m-auto max-w-md p-6 text-center">
          <p className="font-display text-2xl">This chat isn&apos;t here.</p>
          <p className="mt-2 text-ink-soft">Chats are saved in this browser only.</p>
          <Link href="/" className="mt-5 inline-block rounded-full bg-ink px-5 py-2 text-sm text-canvas">
            Start a new chat
          </Link>
        </div>
      </ChatLayout>
    );
  }

  const lastAssistant = [...chat.messages].reverse().find((m) => m.role === "assistant");
  const lastUser = [...chat.messages].reverse().find((m) => m.role === "user");

  return (
    <ChatLayout activeId={id} title={chat.title}>
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
                <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl bg-ink px-4 py-2.5 text-canvas">{m.text}</div>
              </div>
            ) : (
              <AssistantMessage
                key={m.id}
                msg={m}
                isLast={m.id === lastAssistant?.id}
                hidden={hidden}
                onRef={(n) => {
                  const p = refs.get(n);
                  if (p) setQuick(p);
                }}
                onOpen={setQuick}
                onMoreLike={(p) => {
                  useSession.getState().track("more_like", p);
                  send(p.ref != null ? `More like #${p.ref}` : `More like ${p.title}`);
                }}
                onSend={send}
                onRetry={() => lastUser && send(lastUser.text)}
              />
            ),
          )}
        </div>
      </div>

      <div className="border-t border-line bg-canvas/95 px-4 pb-4 pt-3 backdrop-blur md:px-8">
        <div className="mx-auto max-w-4xl">
          {chat.chips.length > 0 && (
            <div className="no-scrollbar mb-2 flex items-center gap-1.5 overflow-x-auto text-xs">
              <span className="shrink-0 uppercase tracking-wide text-ink-faint">This chat remembers</span>
              {chat.chips.map((c) => (
                <span key={c.key} className="inline-flex shrink-0 items-center gap-1 rounded-full border border-line bg-paper py-0.5 pl-2.5 pr-1">
                  {c.label}
                  <button
                    onClick={() => send(`Drop "${c.label.replace(/^[~✕]\s*/, "")}"${c.kind === "exclude" ? " (it's fine now)" : ""}`)}
                    disabled={running}
                    className="rounded-full p-0.5 opacity-60 hover:bg-black/5 hover:opacity-100"
                    aria-label={`Drop ${c.label}`}
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          )}
          <Composer ref={composer} onSend={send} onStop={() => stopChat(id)} running={running} placeholder="Ask a follow-up, e.g. “cheaper” or “compare #1 and #4”" />
        </div>
      </div>

      <Drawer open={!!quick} onClose={() => setQuick(null)} title={quick?.brand}>
        {quick && (
          <ProductDetails
            p={quick}
            onOpen={setQuick}
            onAsk={(p) => {
              setQuick(null);
              composer.current?.insert(p.ref != null ? `#${p.ref} ` : `${p.title}: `);
            }}
          />
        )}
      </Drawer>
    </ChatLayout>
  );
}
