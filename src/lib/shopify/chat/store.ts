"use client";

/** Genuine Finds conversations and saved items, in this browser only (separate storage from Drape's). */
import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import type { CompareItem, Excluded, FindsEvent, Shown } from "../agent/types";
import type { Audience } from "../config";
import { type CountryCode, getCountry } from "../countries";
import { money } from "../format";
import type { SearchSpec } from "../search";
import type { ShopifyCard } from "../types";

export type SectionBlock = {
  kind: "section";
  id: string;
  title: string;
  why: string;
  /** Null while loading. "See all" re-runs it. */
  search: SearchSpec | null;
  products: ShopifyCard[];
  hasMore: boolean;
  loaded: boolean;
  note?: string;
};
export type Block = { kind: "text"; text: string } | SectionBlock | { kind: "compare"; items: CompareItem[]; focus: string | null };

export type FindsUserMsg = { id: string; role: "user"; text: string };
export type FindsAssistantMsg = {
  id: string;
  role: "assistant";
  status: "streaming" | "done" | "error";
  /** Live progress line ("Searching …"), cleared when done. */
  activity: string | null;
  blocks: Block[];
  followups: string[];
  error?: string;
};
export type FindsMsg = FindsUserMsg | FindsAssistantMsg;

export type FindsChat = {
  id: string;
  title: string;
  country: CountryCode;
  audience: Audience | null;
  createdAt: number;
  updatedAt: number;
  messages: FindsMsg[];
  shown: Shown[];
  nextRef: number;
  /** "This chat remembers" chips. */
  chips: string[];
  /** "Not for me": hidden here and excluded from later searches. */
  hidden: Excluded[];
};

export type SavedItem = ShopifyCard & { country: CountryCode; savedAt: number };

type State = { chats: Record<string, FindsChat>; order: string[]; country: CountryCode; audience: Audience | null; saved: SavedItem[] };
type Actions = {
  setCountry: (c: CountryCode) => void;
  setAudience: (a: Audience | null) => void;
  newChat: (country: CountryCode, audience: Audience | null) => string;
  deleteChat: (id: string) => void;
  addUser: (chatId: string, text: string) => void;
  addAssistant: (chatId: string) => string;
  apply: (chatId: string, msgId: string, e: FindsEvent) => void;
  finish: (chatId: string, msgId: string, error?: string) => void;
  hide: (chatId: string, p: ShopifyCard, reason: string) => void;
  toggleSave: (p: ShopifyCard, country: CountryCode) => void;
};

const MAX_CHATS = 25;
const MAX_MESSAGES = 40;
const MAX_SAVED = 100;
const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
const titleFrom = (t: string) => {
  const s = t.replace(/\[([^\]]+)\]\(#\d+\)/g, "$1").replace(/\s+/g, " ").trim();
  return s.length > 48 ? `${s.slice(0, 46)}…` : s || "New chat";
};

function patch(chat: FindsChat, msgId: string, fn: (m: FindsAssistantMsg) => FindsAssistantMsg): FindsChat {
  return { ...chat, updatedAt: Date.now(), messages: chat.messages.map((m) => (m.id === msgId && m.role === "assistant" ? fn(m) : m)) };
}

function reduce(chat: FindsChat, msgId: string, e: FindsEvent): FindsChat {
  switch (e.type) {
    case "status":
      return patch(chat, msgId, (m) => ({ ...m, activity: e.label }));
    case "text":
      return patch(chat, msgId, (m) => {
        const last = m.blocks[m.blocks.length - 1];
        if (last?.kind === "text") return { ...m, blocks: [...m.blocks.slice(0, -1), { kind: "text", text: last.text + e.delta }] };
        return { ...m, blocks: [...m.blocks, { kind: "text", text: e.delta }] };
      });
    case "section_start":
      return patch(chat, msgId, (m) => ({
        ...m,
        blocks: [...m.blocks, { kind: "section", id: e.id, title: e.title, why: e.why, search: null, products: [], hasMore: false, loaded: false }],
      }));
    case "section": {
      const block: SectionBlock = { kind: "section", id: e.id, title: e.title, why: e.why, search: e.search, products: e.products, hasMore: e.hasMore, loaded: true, note: e.note };
      const next = patch(chat, msgId, (m) => ({
        ...m,
        blocks: m.blocks.some((b) => b.kind === "section" && b.id === e.id) ? m.blocks.map((b) => (b.kind === "section" && b.id === e.id ? block : b)) : [...m.blocks, block],
      }));
      const locale = getCountry(chat.country).locale;
      const shown: Shown[] = e.products.flatMap((p) =>
        p.ref == null ? [] : [{ ref: p.ref, id: p.id, title: p.title, store: p.seller, price: p.price ? `${p.priceFrom ? "from " : ""}${money(p.price, locale)}` : "price on site" }],
      );
      return { ...next, shown: [...next.shown, ...shown].slice(-150), nextRef: Math.max(next.nextRef, ...shown.map((s) => s.ref + 1)) };
    }
    case "compare":
      return patch(chat, msgId, (m) => ({ ...m, blocks: [...m.blocks, { kind: "compare", items: e.items, focus: e.focus }] }));
    case "chips":
      return { ...chat, chips: e.items.slice(0, 12) };
    case "followups":
      return patch(chat, msgId, (m) => ({ ...m, followups: e.items }));
    case "error":
      return patch(chat, msgId, (m) => ({ ...m, status: "error", activity: null, error: e.message }));
    case "done":
      return patch(chat, msgId, (m) => ({ ...m, status: m.status === "error" ? "error" : "done", activity: null }));
  }
}

/** localStorage that survives quota errors and private mode. */
const safeStorage: StateStorage = {
  getItem: (k) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  setItem: (k, v) => {
    try {
      localStorage.setItem(k, v);
    } catch {
      // Quota: keep the session working in memory.
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

export const useFinds = create<State & Actions>()(
  persist(
    (set, get) => {
      const update = (chatId: string, fn: (c: FindsChat) => FindsChat) => {
        const c = get().chats[chatId];
        if (c) set({ chats: { ...get().chats, [chatId]: fn(c) } });
      };
      return {
        chats: {},
        order: [],
        country: "IN",
        audience: null,
        saved: [],
        setCountry: (country) => set({ country }),
        setAudience: (audience) => set({ audience }),
        newChat: (country, audience) => {
          const id = uid();
          const now = Date.now();
          const chat: FindsChat = { id, title: "New chat", country, audience, createdAt: now, updatedAt: now, messages: [], shown: [], nextRef: 1, chips: [], hidden: [] };
          const order = [id, ...get().order].slice(0, MAX_CHATS);
          const chats = Object.fromEntries(order.map((k) => [k, k === id ? chat : get().chats[k]]).filter(([, c]) => c));
          set({ chats, order, country, audience });
          return id;
        },
        deleteChat: (id) => {
          const chats = { ...get().chats };
          delete chats[id];
          set({ chats, order: get().order.filter((k) => k !== id) });
        },
        addUser: (chatId, text) => {
          update(chatId, (c) => ({
            ...c,
            title: c.messages.length ? c.title : titleFrom(text),
            updatedAt: Date.now(),
            messages: [...c.messages, { id: uid(), role: "user" as const, text }].slice(-MAX_MESSAGES),
          }));
          set({ order: [chatId, ...get().order.filter((k) => k !== chatId)] });
        },
        addAssistant: (chatId) => {
          const id = uid();
          update(chatId, (c) => ({ ...c, messages: [...c.messages, { id, role: "assistant" as const, status: "streaming" as const, activity: null, blocks: [], followups: [] }].slice(-MAX_MESSAGES) }));
          return id;
        },
        apply: (chatId, msgId, e) => update(chatId, (c) => reduce(c, msgId, e)),
        finish: (chatId, msgId, error) =>
          update(chatId, (c) =>
            patch(c, msgId, (m) => (error ? { ...m, status: "error", activity: null, error } : { ...m, status: m.status === "streaming" ? "done" : m.status, activity: null })),
          ),
        hide: (chatId, p, reason) =>
          update(chatId, (c) => (c.hidden.some((h) => h.id === p.id) ? c : { ...c, hidden: [...c.hidden, { id: p.id, title: p.title.slice(0, 300), reason }].slice(-60) })),
        toggleSave: (p, country) => {
          const saved = get().saved;
          set({
            saved: saved.some((s) => s.id === p.id) ? saved.filter((s) => s.id !== p.id) : [{ ...p, ref: undefined, country, savedAt: Date.now() }, ...saved].slice(0, MAX_SAVED),
          });
        },
      };
    },
    {
      name: "genuine-finds-chats",
      version: 2,
      storage: createJSONStorage(() => safeStorage),
      // v1 chats predate chips/audience/hidden.
      migrate: (state, version) => {
        const s = state as State;
        if (version < 2) {
          for (const c of Object.values(s.chats ?? {})) Object.assign(c, { audience: c.audience ?? null, chips: c.chips ?? [], hidden: c.hidden ?? [] });
          s.saved ??= [];
          s.audience ??= null;
        }
        return s;
      },
      // A reload mid-stream can't resume: settle any half-finished turn.
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        for (const c of Object.values(state.chats)) {
          c.messages = c.messages.map((m) => (m.role === "assistant" && m.status === "streaming" ? { ...m, status: "error", activity: null, error: "Interrupted. Try again." } : m));
        }
      },
    },
  ),
);

/** What the model sees of an earlier assistant turn: its text plus which rows it showed. */
export function historyText(m: FindsMsg): string {
  if (m.role === "user") return m.text;
  return m.blocks
    .map((b) =>
      b.kind === "text"
        ? b.text
        : b.kind === "section"
          ? `[Showed "${b.title}": ${b.products.map((p) => `#${p.ref}`).join(" ")}]`
          : `[Compared ${b.items.map((i) => `#${i.ref}`).join(", ")}]`,
    )
    .join("\n")
    .trim()
    .slice(0, 3500);
}

/** "[name](#12)" → "name", for user bubbles and titles. */
export const plainMentions = (t: string) => t.replace(/\[([^\]]+)\]\(#\d+\)/g, "$1");
