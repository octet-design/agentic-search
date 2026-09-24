"use client";

import { Bug, Copy, X } from "lucide-react";
import { useState } from "react";
import type { StreamState } from "@/hooks/useAgentStream";

/** ?debug=1: intent, per-rail filters and relaxation, rerank drops, timings, tokens, cost (brief §9.9). */
export function DebugPanel({ state, query }: { state: StreamState; query: string }) {
  const [open, setOpen] = useState(true);
  const [copied, setCopied] = useState(false);
  const data = { query, intent: state.intent, chips: state.chips, personalized: state.personalized, debug: state.debug, done: state.done };
  const dbg = (state.debug ?? {}) as {
    rails?: { id: string; title?: string; q: string; filter: string; found: number; relaxed: string[]; rounds: { found: number; usable: number; ms: number }[]; dropped: Record<string, number> }[];
    rerank?: Record<string, { timeout?: boolean; scored?: number; kept?: number; dropped?: { title: string; why: string }[]; errors?: string[] }>;
    llmCalls?: { name: string; model: string; ms: number; in: number; out: number }[];
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="fixed bottom-4 left-4 z-30 inline-flex items-center gap-1 rounded-full bg-ink px-3 py-2 text-xs text-canvas shadow-lg">
        <Bug size={14} /> Debug
      </button>
    );
  }
  return (
    <aside className="fixed bottom-0 left-0 top-0 z-30 flex w-full max-w-md flex-col border-r border-line bg-paper text-xs shadow-xl">
      <div className="flex items-center justify-between border-b border-line px-3 py-2">
        <span className="inline-flex items-center gap-1 font-medium">
          <Bug size={14} /> Debug
        </span>
        <div className="flex items-center gap-1">
          <button
            className="inline-flex items-center gap-1 rounded-md border border-line px-2 py-1 hover:bg-sand"
            onClick={() => {
              navigator.clipboard.writeText(JSON.stringify(data, null, 2)).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              });
            }}
          >
            <Copy size={12} /> {copied ? "Copied" : "Copy as JSON"}
          </button>
          <button onClick={() => setOpen(false)} className="rounded-md p-1 hover:bg-sand" aria-label="Close debug">
            <X size={14} />
          </button>
        </div>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto p-3">
        {state.done && (
          <section>
            <h4 className="mb-1 font-semibold">Run</h4>
            <div>
              {Object.entries(state.done.timings).map(([k, v]) => `${k} ${v}ms`).join(" · ")}
              <br />
              tokens {state.done.tokens.in} in / {state.done.tokens.out} out · ${state.done.costUsd.toFixed(4)} · cache {state.done.cacheHit ? "hit" : "miss"}
            </div>
          </section>
        )}
        {dbg.llmCalls && (
          <section>
            <h4 className="mb-1 font-semibold">LLM calls</h4>
            {dbg.llmCalls.map((c, i) => (
              <div key={i}>
                {c.name} · {c.model} · {c.ms}ms · {c.in}/{c.out}
              </div>
            ))}
          </section>
        )}
        {dbg.rails?.map((r) => (
          <section key={r.id}>
            <h4 className="mb-1 font-semibold">
              Rail {r.id}
              {r.title ? ` — ${r.title}` : ""} · {r.found} found
            </h4>
            <div className="text-ink-soft">q: {r.q}</div>
            <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap break-all rounded bg-sand p-2">{r.filter}</pre>
            <div className="mt-1">rounds: {r.rounds.map((x) => `${x.found}/${x.usable} (${x.ms}ms)`).join(" → ")}</div>
            {r.relaxed.length > 0 && <div>relaxed: {r.relaxed.join(", ")}</div>}
            {Object.keys(r.dropped).length > 0 && <div>post-filter drops: {Object.entries(r.dropped).map(([k, v]) => `${k}×${v}`).join(", ")}</div>}
            {dbg.rerank?.[r.id] && (
              <div className="mt-1">
                rerank:{" "}
                {dbg.rerank[r.id].timeout
                  ? "timeout → fallback reasons"
                  : `scored ${dbg.rerank[r.id].scored}, kept ${dbg.rerank[r.id].kept}, dropped ${dbg.rerank[r.id].dropped?.length ?? 0}`}
                {dbg.rerank[r.id].dropped?.slice(0, 6).map((d, i) => (
                  <div key={i} className="text-ink-soft">
                    ✕ {d.title} — {d.why}
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}
        <section>
          <h4 className="mb-1 font-semibold">Intent</h4>
          <pre className="overflow-auto whitespace-pre-wrap break-all rounded bg-sand p-2">{JSON.stringify(state.intent, null, 2)}</pre>
        </section>
      </div>
    </aside>
  );
}
