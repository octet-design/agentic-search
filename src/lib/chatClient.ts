"use client";

/**
 * Sends one chat turn and streams its events into the chat store. A module function (not a hook), so a
 * turn keeps streaming while the page navigates, e.g. from the home composer to /chat/<id>.
 */
import type { AgentEvent } from "./agent/types";
import { tastePayload } from "./taste";
import { historyText, useChats } from "@/store/chats";
import { useSession } from "@/store/session";

const running = new Map<string, AbortController>();

export function isChatRunning(chatId: string) {
  return running.has(chatId);
}

export async function sendChatMessage(chatId: string, text: string, opts: { debug?: boolean } = {}) {
  const message = text.trim();
  if (!message) return;
  running.get(chatId)?.abort();
  const ac = new AbortController();
  running.set(chatId, ac);

  const chats = useChats.getState();
  const before = chats.chats[chatId];
  if (!before) return;
  const history = before.messages.slice(-10).map((m) => ({ role: m.role, content: historyText(m) })).filter((m) => m.content);
  chats.addUser(chatId, message);
  const msgId = chats.addAssistant(chatId);

  const session = useSession.getState();
  const body = {
    message,
    history,
    state: { intent: before.intent, lastSections: before.lastSections, products: before.shown.slice(-120), nextRef: before.nextRef },
    memory: session.memory.map((m) => m.text),
    taste: tastePayload({ profile: session.profile, signals: session.signals }),
    debug: opts.debug,
  };

  try {
    const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: ac.signal });
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
        let e: AgentEvent;
        try {
          e = JSON.parse(line.slice(6)) as AgentEvent;
        } catch {
          continue;
        }
        if (e.type === "memory") useSession.getState().addMemory(e.facts);
        useChats.getState().applyEvent(chatId, msgId, e);
      }
    }
    useChats.getState().finishAssistant(chatId, msgId);
  } catch (err) {
    if (ac.signal.aborted) {
      useChats.getState().failAssistant(chatId, msgId, "Stopped.");
      return;
    }
    useChats.getState().failAssistant(chatId, msgId, err instanceof Error ? err.message : "Something went wrong.");
  } finally {
    if (running.get(chatId) === ac) running.delete(chatId);
  }
}

export function stopChat(chatId: string) {
  running.get(chatId)?.abort();
}
