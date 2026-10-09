"use client";

/**
 * Conversations (Drape v2), stored in this browser only. Each chat keeps its own context: running intent,
 * shown products with stable #refs, last sections. Nothing leaks between chats except learned taste, and only when the planner judges it useful.
 */
import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import type { StepState } from "@/hooks/useAgentStream";
import type { AudienceKey } from "@/store/session";
import type { AgentEvent, Anchor, ChatPick, SegmentOffer, ChatSectionSpec, Chip, CompareBlockData, Intent, ProductCard } from "@/lib/agent/types";

export type ChatSection = {
  id: string;
  title: string;
  why: string;
  query: string;
  products: ProductCard[];
  relaxedNote?: string;
  /** Filters the section used; "See all" re-runs them without the LLM. */
  intent?: Intent;
  /** Scout: what counts as an exact match, and the note when nothing does. */
  anchor?: Anchor;
  emptyNote?: string;
  loaded: boolean;
};

/** refs: products the message points at (card buttons), since ref numbers are no longer typed by users. */
export type UserMessage = {
  id: string;
  role: "user";
  text: string;
  at: number;
  refs?: number[];
  /** A small preview of the photo sent with this message (the full image isn't stored). */
  thumb?: string;
  /** What the photo shows, as the agent read it; carried into later turns' history. */
  photo?: string;
};
export type AssistantMessage = {
  id: string;
  role: "assistant";
  at: number;
  status: "streaming" | "done" | "error";
  intro: string;
  sections: ChatSection[];
  outro: string;
  /** Scout: segments offered as pills, fetched only when tapped. */
  segments?: SegmentOffer[];
  /** Drape's picks: products from this message's sections, explained. */
  picks?: ChatPick[];
  answer: string;
  compare?: CompareBlockData;
  /** Older chats: a clarify card. New turns close with `ask` instead. */
  clarify?: { question: string; options: string[] };
  /** The one question that closes the answer, with tappable answers. */
  ask?: { question: string; options: string[] };
  followups: string[];
  steps: StepState[];
  personalized: string[];
  error?: string;
  meta?: { ms?: number; costUsd?: number };
};
export type ChatMessage = UserMessage | AssistantMessage;

export type ShownRef = { ref: number; id: string; title: string; brand: string; color: string; fabric: string | null; category: string; price: number };

export type Chat = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  intent: Intent | null;
  chips: Chip[];
  lastSections: ChatSectionSpec[];
  shown: ShownRef[];
  nextRef: number;
  /** Picked in "Shopping for" when the chat started (null = anyone). */
  audience?: AudienceKey | null;
  /** Which app the chat belongs to: Drape's home (default), Typesense search ("aura") or Scout ("blend"). */
  surface?: "drape" | "aura" | "blend";
  /** Aura++: products from outside the chat (feed, similar, brand) the shopper asked about, given refs here. */
  pinned?: ProductCard[];
};

type State = { chats: Record<string, Chat>; order: string[] };
type Actions = {
  newChat: (audience?: AudienceKey | null, surface?: Chat["surface"]) => string;
  /** Gives an outside product a ref in this chat (or returns the one it has). */
  pin: (chatId: string, card: ProductCard) => number;
  deleteChat: (id: string) => void;
  renameChat: (id: string, title: string) => void;
  addUser: (chatId: string, text: string, refs?: number[], thumb?: string) => string;
  /** Records what the photo on a user message shows. */
  setPhoto: (chatId: string, userMsgId: string, description: string) => void;
  addAssistant: (chatId: string) => string;
  applyEvent: (chatId: string, msgId: string, e: AgentEvent) => void;
  /** Scout: a tapped segment pill becomes a result set in that message (products get refs here). */
  openSegment: (chatId: string, msgId: string, seg: SegmentOffer, products: ProductCard[], emptyNote?: string) => void;
  failAssistant: (chatId: string, msgId: string, error: string) => void;
  finishAssistant: (chatId: string, msgId: string) => void;
};

const MAX_CHATS = 25;
const MAX_MESSAGES = 40;

const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

const titleFrom = (text: string) => {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length > 48 ? `${t.slice(0, 46)}…` : t || "New chat";
};

/** Drops heavy fields from cards before they are stored (localStorage is ~5 MB). */
const slim = (p: ProductCard): ProductCard => ({ ...p, sizes: p.sizes.slice(0, 12), useCase: p.useCase.slice(0, 3), reason: "", matched: [] });

function updateMsg(chat: Chat, msgId: string, fn: (m: AssistantMessage) => AssistantMessage): Chat {
  return { ...chat, messages: chat.messages.map((m) => (m.id === msgId && m.role === "assistant" ? fn(m) : m)), updatedAt: Date.now() };
}

function reduce(chat: Chat, msgId: string, e: AgentEvent): Chat {
  switch (e.type) {
    case "chat_text":
      return updateMsg(chat, msgId, (m) => ({ ...m, [e.block]: m[e.block] + e.delta }));
    case "sections_plan":
      return updateMsg(chat, msgId, (m) => ({
        ...m,
        sections: e.sections.map((s) => ({ id: s.id, title: s.title, why: s.why, query: "", products: [], loaded: false })),
      }));
    case "section": {
      const section: ChatSection = { id: e.id, title: e.title, why: e.why, query: e.query, products: e.products.map(slim), relaxedNote: e.relaxedNote, intent: e.intent, anchor: e.anchor, emptyNote: e.emptyNote, loaded: true };
      const next = updateMsg(chat, msgId, (m) => ({
        ...m,
        sections: m.sections.some((s) => s.id === e.id) ? m.sections.map((s) => (s.id === e.id ? section : s)) : [...m.sections, section],
      }));
      const refs = e.products.filter((p) => p.ref != null).map((p) => ({ ref: p.ref!, id: p.id, title: p.title, brand: p.brand, color: p.color, fabric: p.fabric, category: p.category, price: p.price }));
      return { ...next, shown: [...next.shown, ...refs].slice(-120), nextRef: Math.max(next.nextRef, ...refs.map((r) => r.ref + 1)) };
    }
    case "compare":
      return updateMsg(chat, msgId, (m) => ({ ...m, compare: { ...e.data, products: e.data.products.map(slim) } }));
    case "clarify":
      return updateMsg(chat, msgId, (m) => ({ ...m, clarify: { question: e.question, options: e.options } }));
    case "segments":
      return updateMsg(chat, msgId, (m) => ({ ...m, segments: e.items }));
    case "picks":
      return updateMsg(chat, msgId, (m) => ({ ...m, picks: e.items }));
    case "ask":
      return updateMsg(chat, msgId, (m) => ({ ...m, ask: { question: e.question, options: e.options } }));
    case "suggestions":
      return updateMsg(chat, msgId, (m) => ({ ...m, followups: e.items }));
    case "chat_state":
      return updateMsg({ ...chat, intent: e.intent, chips: e.chips, lastSections: e.lastSections }, msgId, (m) => ({ ...m, personalized: e.personalized }));
    case "step": {
      return updateMsg(chat, msgId, (m) => {
        const idx = m.steps.findIndex((s) => s.id === e.id);
        const step: StepState = { id: e.id, label: e.label, status: e.status, ms: e.ms };
        return { ...m, steps: idx >= 0 ? m.steps.map((s, i) => (i === idx ? step : s)) : [...m.steps, step] };
      });
    }
    case "done":
      return updateMsg(chat, msgId, (m) => ({ ...m, status: "done", meta: { ms: e.timings.total, costUsd: e.costUsd } }));
    case "error":
      return updateMsg(chat, msgId, (m) => ({ ...m, status: "error", error: e.message }));
    default:
      return chat;
  }
}

/** localStorage that survives quota errors by dropping the oldest chats. */
const safeStorage: StateStorage = {
  getItem: (k) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  setItem: (k, v) => {
    for (let attempt = 0; attempt < 6; attempt++) {
      try {
        localStorage.setItem(k, v);
        return;
      } catch {
        const parsed = JSON.parse(v) as { state: State; version: number };
        const order = parsed.state.order;
        if (order.length <= 1) return;
        const drop = order[order.length - 1];
        delete parsed.state.chats[drop];
        parsed.state.order = order.slice(0, -1);
        v = JSON.stringify(parsed);
      }
    }
  },
  removeItem: (k) => {
    try {
      localStorage.removeItem(k);
    } catch {
      // ignore
    }
  },
};

export const useChats = create<State & Actions>()(
  persist(
    (set, get) => ({
      chats: {},
      order: [],
      newChat: (audience = null, surface = "drape") => {
        const id = uid();
        const now = Date.now();
        set((s) => {
          const chat: Chat = { id, title: "New chat", createdAt: now, updatedAt: now, messages: [], intent: null, chips: [], lastSections: [], shown: [], nextRef: 1, audience, surface };
          const order = [id, ...s.order];
          const chats = { ...s.chats, [id]: chat };
          for (const old of order.slice(MAX_CHATS)) delete chats[old];
          return { chats, order: order.slice(0, MAX_CHATS) };
        });
        return id;
      },
      pin: (chatId, card) => {
        const c = get().chats[chatId];
        if (!c) return 0;
        const known = c.shown.find((s) => s.id === card.id);
        if (known) return known.ref;
        const ref = c.nextRef;
        const shown: ShownRef = { ref, id: card.id, title: card.title, brand: card.brand, color: card.color, fabric: card.fabric, category: card.category, price: card.price };
        set((s) => ({
          chats: { ...s.chats, [chatId]: { ...c, nextRef: ref + 1, shown: [...c.shown, shown].slice(-120), pinned: [...(c.pinned ?? []), slim({ ...card, ref })].slice(-40) } },
        }));
        return ref;
      },
      deleteChat: (id) =>
        set((s) => {
          const chats = { ...s.chats };
          delete chats[id];
          return { chats, order: s.order.filter((x) => x !== id) };
        }),
      renameChat: (id, title) => set((s) => (s.chats[id] ? { chats: { ...s.chats, [id]: { ...s.chats[id], title: titleFrom(title) } } } : s)),
      addUser: (chatId, text, refs, thumb) => {
        const id = uid();
        set((s) => {
          const chat = s.chats[chatId];
          if (!chat) return s;
          const first = !chat.messages.some((m) => m.role === "user");
          const msg: UserMessage = { id, role: "user", text, at: Date.now(), ...(refs?.length ? { refs } : {}), ...(thumb ? { thumb } : {}) };
          return {
            chats: { ...s.chats, [chatId]: { ...chat, title: first ? titleFrom(text) : chat.title, messages: [...chat.messages, msg].slice(-MAX_MESSAGES), updatedAt: Date.now() } },
            order: [chatId, ...s.order.filter((x) => x !== chatId)],
          };
        });
        return id;
      },
      setPhoto: (chatId, userMsgId, description) =>
        set((s) => {
          const chat = s.chats[chatId];
          if (!chat) return s;
          const messages = chat.messages.map((m) => (m.id === userMsgId && m.role === "user" ? { ...m, photo: description } : m));
          return { chats: { ...s.chats, [chatId]: { ...chat, messages } } };
        }),
      addAssistant: (chatId) => {
        const id = uid();
        set((s) => {
          const chat = s.chats[chatId];
          if (!chat) return s;
          const msg: AssistantMessage = { id, role: "assistant", at: Date.now(), status: "streaming", intro: "", sections: [], outro: "", answer: "", followups: [], steps: [], personalized: [] };
          return { chats: { ...s.chats, [chatId]: { ...chat, messages: [...chat.messages, msg].slice(-MAX_MESSAGES) } } };
        });
        return id;
      },
      applyEvent: (chatId, msgId, e) => set((s) => (s.chats[chatId] ? { chats: { ...s.chats, [chatId]: reduce(s.chats[chatId], msgId, e) } } : s)),
      openSegment: (chatId, msgId, seg, products, emptyNote) =>
        set((s) => {
          const chat = s.chats[chatId];
          if (!chat) return s;
          let ref = chat.nextRef;
          const withRefs = products.map((p) => ({ ...p, ref: ref++ }));
          const e: AgentEvent = { type: "section", id: seg.id, title: seg.title, why: seg.why, query: seg.intent.semanticQuery, products: withRefs, more: [], intent: seg.intent, anchor: seg.anchor, emptyNote };
          const next = updateMsg(reduce(chat, msgId, e), msgId, (m) => ({ ...m, segments: (m.segments ?? []).filter((x) => x.id !== seg.id) }));
          return { chats: { ...s.chats, [chatId]: next } };
        }),
      failAssistant: (chatId, msgId, error) =>
        set((s) => (s.chats[chatId] ? { chats: { ...s.chats, [chatId]: updateMsg(s.chats[chatId], msgId, (m) => ({ ...m, status: "error", error })) } } : s)),
      finishAssistant: (chatId, msgId) =>
        set((s) =>
          s.chats[chatId] ? { chats: { ...s.chats, [chatId]: updateMsg(s.chats[chatId], msgId, (m) => (m.status === "streaming" ? { ...m, status: "done" } : m)) } } : s,
        ),
    }),
    {
      name: "drape.chats.v1",
      version: 1,
      storage: createJSONStorage(() => safeStorage),
      // A reload mid-stream leaves a message "streaming" forever; mark it interrupted.
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        for (const chat of Object.values(state.chats)) {
          chat.messages = chat.messages.map((m) => (m.role === "assistant" && m.status === "streaming" ? { ...m, status: "error", error: "Interrupted. Ask again to continue." } : m));
        }
      },
    },
  ),
);

/** Compact text of a message for the model's conversation history. */
export function historyText(m: ChatMessage): string {
  if (m.role === "user") return m.photo ? `${m.text} [attached photo: ${m.photo}]` : m.text;
  const shown = m.sections
    .filter((s) => s.products.length)
    .map((s) => `${s.title} (#${s.products[0].ref}–#${s.products[s.products.length - 1].ref})`)
    .join(", ");
  const asked = m.ask ?? m.clarify;
  // The closing question goes last and is never cut, so the next turn knows what "red" answers.
  const tail = asked ? ` I asked: ${asked.question}` : "";
  const offered = m.segments?.length ? `[Can also show: ${m.segments.map((x) => x.title).join(", ")}]` : "";
  const picked = m.picks?.length ? `[Picked: ${m.picks.map((x) => `#${x.ref} (${x.headline})`).join(", ")}]` : "";
  const body = [m.intro, m.answer, picked, m.outro, shown ? `[Showed: ${shown}]` : "", offered, m.compare ? `[Compared ${m.compare.products.map((p) => `#${p.ref}`).join(", ")}]` : ""]
    .filter(Boolean)
    .join(" ");
  return (body.slice(0, 1200 - tail.length) + tail).trim();
}
