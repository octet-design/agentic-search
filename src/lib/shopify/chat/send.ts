"use client";

/**
 * Sends one Genuine Finds turn and streams its events into the store. A module function (not a hook),
 * so a turn keeps streaming while the page navigates from /finds to /finds/<id>.
 */
import type { FindsEvent } from "../agent/types";
import { historyText, useFinds } from "./store";

const running = new Map<string, AbortController>();

export async function sendFindsMessage(chatId: string, text: string) {
  const message = text.trim();
  if (!message) return;
  running.get(chatId)?.abort();
  const ac = new AbortController();
  running.set(chatId, ac);

  const store = useFinds.getState();
  const before = store.chats[chatId];
  if (!before) return;
  const history = before.messages
    .slice(-10)
    .map((m) => ({ role: m.role, content: historyText(m) }))
    .filter((m) => m.content);
  store.addUser(chatId, message);
  const msgId = store.addAssistant(chatId);

  try {
    const res = await fetch("/api/shopify/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        history,
        country: before.country,
        audience: before.audience,
        remembered: before.chips,
        excluded: before.hidden,
        shown: before.shown,
        nextRef: before.nextRef,
      }),
      signal: ac.signal,
    });
    if (!res.ok || !res.body) {
      const err = (await res.json().catch(() => null)) as { message?: string } | null;
      throw new Error(err?.message ?? `Request failed (${res.status})`);
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
        const line = buf
          .slice(0, idx)
          .split("\n")
          .find((l) => l.startsWith("data: "));
        buf = buf.slice(idx + 2);
        if (!line) continue;
        try {
          useFinds.getState().apply(chatId, msgId, JSON.parse(line.slice(6)) as FindsEvent);
        } catch {
          // skip a malformed event
        }
      }
    }
    useFinds.getState().finish(chatId, msgId);
  } catch (err) {
    useFinds.getState().finish(chatId, msgId, ac.signal.aborted ? "Stopped." : err instanceof Error ? err.message : "Something went wrong.");
  } finally {
    if (running.get(chatId) === ac) running.delete(chatId);
  }
}

export function stopFinds(chatId: string) {
  running.get(chatId)?.abort();
}
