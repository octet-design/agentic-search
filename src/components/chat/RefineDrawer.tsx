"use client";

import { ArrowUp, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { useTastePayload } from "@/hooks/useTaste";
import type { AgentEvent, Intent, ProductCard } from "@/lib/agent/types";
import { cn } from "@/lib/format";

type Msg = { role: "user" | "assistant"; content: string; options?: string[] };

const STARTERS = ["Cheaper", "More colourful", "No polyester", "Show men's instead"];

/** Chat drawer that drives the main results (brief §7). Bottom sheet on mobile. */
export function RefineDrawer({
  open,
  onClose,
  query,
  intent,
  visible,
  onEvent,
  onIntent,
}: {
  open: boolean;
  onClose: () => void;
  query: string;
  intent: Intent | null;
  visible: ProductCard[];
  onEvent: (e: AgentEvent) => void;
  onIntent: (i: Intent) => void;
}) {
  const router = useRouter();
  const taste = useTastePayload();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>(STARTERS);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Block body: scroll methods return a Promise in current Chromium, which React would treat as a cleanup.
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  const send = async (text: string) => {
    const t = text.trim();
    if (!t || !intent || busy) return;
    const history: Msg[] = [...messages, { role: "user", content: t }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);
    setSuggestions([]);
    try {
      const res = await fetch("/api/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          intent,
          taste,
          messages: history.map(({ role, content }) => ({ role, content })),
          visible: visible.map((p, i) => ({ n: i + 1, id: p.id, title: p.title, brand: p.brand, color: p.color, price: p.price })),
        }),
      });
      if (!res.ok || !res.body) throw new Error((await res.json().catch(() => null))?.message ?? "Couldn't refine right now.");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buf.indexOf("\n\n")) >= 0) {
          const line = buf.slice(0, idx).split("\n").find((l) => l.startsWith("data: "));
          buf = buf.slice(idx + 2);
          if (!line) continue;
          const e = JSON.parse(line.slice(6)) as AgentEvent;
          if (e.type === "text") setMessages((m) => m.map((x, i) => (i === m.length - 1 ? { ...x, content: x.content + e.delta } : x)));
          else if (e.type === "suggestions") setSuggestions(e.items);
          else if (e.type === "ask") setMessages((m) => [...m.slice(0, -1), { role: "assistant", content: e.question, options: e.options }, m[m.length - 1]]);
          else if (e.type === "action") router.push(`/compare?ids=${e.ids.join(",")}${e.criterion ? `&c=${encodeURIComponent(e.criterion)}` : ""}&q=${encodeURIComponent(query)}`);
          else if (e.type === "step") setStatus(e.status === "running" ? e.label : null);
          else if (e.type === "error") throw new Error(e.message);
          else if (e.type !== "done") {
            if (e.type === "intent") onIntent(e.intent);
            onEvent(e);
          }
        }
      }
    } catch (err) {
      setMessages((m) => m.map((x, i) => (i === m.length - 1 ? { ...x, content: err instanceof Error ? err.message : "Something went wrong." } : x)));
    } finally {
      setBusy(false);
      setStatus(null);
      setMessages((m) => m.filter((x) => x.content || x.options));
    }
  };

  return (
    <Drawer open={open} onClose={onClose} title="Refine with Drape">
      <div className="flex h-full min-h-[50vh] flex-col">
        <div className="flex-1 space-y-3 p-4">
          {messages.length === 0 && (
            <p className="text-sm text-ink-soft">
              Tell me what to change: “cheaper”, “like #3 but in blue”, “no polyester”, “show men&apos;s instead”. The results update as we chat.
            </p>
          )}
          {messages.map((m, i) => (
            <div key={i} className={cn("flex flex-col", m.role === "user" ? "items-end" : "items-start")}>
              <div className={cn("max-w-[85%] rounded-2xl px-3 py-2 text-sm", m.role === "user" ? "bg-ink text-canvas" : "bg-sand")}>{m.content}</div>
              {m.options && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {m.options.map((o) => (
                    <button key={o} onClick={() => send(o)} className="rounded-full border border-line px-3 py-1 text-sm hover:border-ink">
                      {o}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          {status && (
            <div className="inline-flex items-center gap-2 text-xs text-ink-soft">
              <Loader2 size={13} className="animate-spin" /> {status}
            </div>
          )}
          <div ref={endRef} />
        </div>
        <div className="sticky bottom-0 border-t border-line bg-paper p-3">
          {suggestions.length > 0 && !busy && (
            <div className="no-scrollbar mb-2 flex gap-1.5 overflow-x-auto">
              {suggestions.map((s) => (
                <button key={s} onClick={() => send(s)} className="shrink-0 rounded-full border border-line px-3 py-1 text-sm hover:border-ink">
                  {s}
                </button>
              ))}
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 rounded-full border border-line px-2 py-1 focus-within:border-ink"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={!intent}
              placeholder={intent ? "e.g. like #3 but in blue" : "Waiting for results…"}
              className="flex-1 bg-transparent px-2 py-1.5 text-sm outline-none"
              aria-label="Message"
            />
            <button disabled={busy || !input.trim()} className="rounded-full bg-ink p-2 text-canvas disabled:opacity-30" aria-label="Send">
              {busy ? <Loader2 size={16} className="animate-spin" /> : <ArrowUp size={16} />}
            </button>
          </form>
        </div>
      </div>
    </Drawer>
  );
}
