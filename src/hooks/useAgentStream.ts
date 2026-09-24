"use client";

import { useCallback, useReducer, useRef } from "react";
import type { AgentEvent, Chip, Intent, ProductCard, RailPlan, SmartFilter, StepId } from "@/lib/agent/types";

export type StepState = { id: StepId; label: string; status: "running" | "done" | "skipped"; ms?: number; detail?: string };
export type RailState = {
  id: string;
  title?: string;
  why?: string;
  products: ProductCard[];
  more: ProductCard[];
  relaxedNote?: string;
  smartFilters?: SmartFilter[];
  total: number;
  loaded: boolean;
};

export type StreamState = {
  status: "idle" | "running" | "done" | "error";
  steps: StepState[];
  intent: Intent | null;
  chips: Chip[];
  personalized: string[];
  clarify: { question: string; options: string[] } | null;
  plan: { stylistNote: string; rails: RailPlan[] } | null;
  rails: Record<string, RailState>;
  railOrder: string[];
  done: Extract<AgentEvent, { type: "done" }> | null;
  error: { message: string; retryable: boolean } | null;
  debug: unknown;
  text: string;
  suggestions: string[];
  ask: { question: string; options: string[] } | null;
  action: { action: "compare"; ids: string[]; criterion?: string } | null;
  startedAt: number;
};

export const initialStream: StreamState = {
  status: "idle",
  steps: [],
  intent: null,
  chips: [],
  personalized: [],
  clarify: null,
  plan: null,
  rails: {},
  railOrder: [],
  done: null,
  error: null,
  debug: null,
  text: "",
  suggestions: [],
  ask: null,
  action: null,
  startedAt: 0,
};

type Action = { type: "start"; keepResults?: boolean } | { type: "event"; e: AgentEvent } | { type: "reset" } | { type: "finish" };

function reducer(s: StreamState, a: Action): StreamState {
  switch (a.type) {
    case "reset":
      return initialStream;
    case "start":
      return a.keepResults
        ? { ...s, status: "running", steps: [], error: null, done: null, text: "", suggestions: [], ask: null, action: null, startedAt: Date.now() }
        : { ...initialStream, status: "running", startedAt: Date.now() };
    case "finish":
      return s.status === "running" ? { ...s, status: "done" } : s;
    case "event": {
      const e = a.e;
      switch (e.type) {
        case "step": {
          const idx = s.steps.findIndex((x) => x.id === e.id);
          const step: StepState = { id: e.id, label: e.label, status: e.status, ms: e.ms, detail: e.detail ?? s.steps[idx]?.detail };
          const steps = idx >= 0 ? s.steps.map((x, i) => (i === idx ? step : x)) : [...s.steps, step];
          return { ...s, steps };
        }
        case "intent":
          return { ...s, intent: e.intent, chips: e.chips, personalized: e.personalized };
        case "clarify":
          return { ...s, clarify: { question: e.question, options: e.options } };
        case "plan": {
          const rails = { ...s.rails };
          for (const r of e.rails) rails[r.id] = { id: r.id, title: r.title, why: r.why, products: [], more: [], total: 0, loaded: false };
          // A plan replaces the main grid.
          delete rails.main;
          return { ...s, plan: { stylistNote: e.stylistNote, rails: e.rails }, rails, railOrder: e.rails.map((r) => r.id) };
        }
        case "results": {
          const prev = s.rails[e.railId];
          const rail: RailState = {
            id: e.railId,
            title: e.title ?? prev?.title,
            why: prev?.why,
            products: e.products,
            more: e.more,
            relaxedNote: e.relaxedNote,
            smartFilters: e.smartFilters,
            total: e.total,
            loaded: true,
          };
          const railOrder = s.railOrder.includes(e.railId) ? s.railOrder : e.railId === "main" ? ["main"] : [...s.railOrder, e.railId];
          const rails = e.railId === "main" ? { main: rail } : { ...s.rails, [e.railId]: rail };
          return { ...s, rails, railOrder, plan: e.railId === "main" ? null : s.plan };
        }
        case "reasons": {
          const rail = s.rails[e.railId];
          if (!rail) return s;
          const upd = new Map(e.items.map((it) => [it.id, it]));
          const patch = (p: ProductCard) => (upd.has(p.id) ? { ...p, reason: upd.get(p.id)!.reason, matched: upd.get(p.id)!.matched } : p);
          return { ...s, rails: { ...s.rails, [e.railId]: { ...rail, products: rail.products.map(patch), more: rail.more.map(patch) } } };
        }
        case "text":
          return { ...s, text: s.text + e.delta };
        case "suggestions":
          return { ...s, suggestions: e.items };
        case "ask":
          return { ...s, ask: { question: e.question, options: e.options } };
        case "action":
          return { ...s, action: { action: e.action, ids: e.ids, criterion: e.criterion } };
        case "debug":
          return { ...s, debug: e.data };
        case "done":
          return { ...s, done: e, status: "done" };
        case "error":
          return { ...s, error: { message: e.message, retryable: e.retryable }, status: "error" };
      }
    }
  }
  return s;
}

/** POSTs to an SSE endpoint and folds events into state. Starting again aborts the previous run. */
export function useAgentStream() {
  const [state, dispatch] = useReducer(reducer, initialStream);
  const abortRef = useRef<AbortController | null>(null);

  const start = useCallback(
    async (url: string, body: unknown, opts: { keepResults?: boolean; onEvent?: (e: AgentEvent) => void } = {}) => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      dispatch({ type: "start", keepResults: opts.keepResults });
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: ac.signal,
        });
        if (!res.ok || !res.body) {
          const err = (await res.json().catch(() => null)) as { message?: string; retryable?: boolean } | null;
          dispatch({ type: "event", e: { type: "error", message: err?.message ?? `Request failed (${res.status})`, retryable: err?.retryable ?? true } });
          return;
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          let idx: number;
          while ((idx = buf.indexOf("\n\n")) >= 0) {
            const chunk = buf.slice(0, idx);
            buf = buf.slice(idx + 2);
            const data = chunk
              .split("\n")
              .filter((l) => l.startsWith("data: "))
              .map((l) => l.slice(6))
              .join("\n");
            if (!data) continue;
            try {
              const e = JSON.parse(data) as AgentEvent;
              dispatch({ type: "event", e });
              opts.onEvent?.(e);
            } catch {
              // ignore malformed chunk
            }
          }
        }
        dispatch({ type: "finish" });
      } catch (err) {
        if (ac.signal.aborted) return;
        dispatch({ type: "event", e: { type: "error", message: err instanceof Error ? err.message : "Network error", retryable: true } });
      }
    },
    [],
  );

  const abort = useCallback(() => abortRef.current?.abort(), []);
  /** Lets another stream (the refine chat) drive this state. */
  const apply = useCallback((e: AgentEvent) => dispatch({ type: "event", e }), []);
  const reset = useCallback(() => dispatch({ type: "reset" }), []);

  return { state, start, abort, apply, reset };
}
