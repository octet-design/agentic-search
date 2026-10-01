"use client";

/**
 * Aura's client state, in this browser only (separate from Drape): chats, saved items, country and "In my size".
 * Chats keep every product they showed (with stable #refs) so follow-ups, "ask about this" and compare work.
 */
import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import type { CompareItem, Excluded, FindsEvent, Shown } from "../agent/types";
import { type CountryCode, getCountry } from "../countries";
import { money } from "../format";
import type { SearchSpec } from "../search";
import type { ShopifyCard } from "../types";

export type SectionBlock = {
  kind: "section";
  id: string;
  title: string;
  why: string;
  /** Null while loading; the results grid pages it for infinite scroll. */
  search: SearchSpec | null;
  products: ShopifyCard[];
  hasMore: boolean;
  loaded: boolean;
  note?: string;
};
export type Block = { kind: "text"; text: string } | SectionBlock | { kind: "compare"; items: CompareItem[]; focus: string | null };

export type AuraUserMsg = { id: string; role: "user"; text: string };
export type AuraAssistantMsg = {
  id: string;
  role: "assistant";
  /** When the turn started (drives the loader's clock). */
  at?: number;
  status: "streaming" | "done" | "error";
  /** Live progress line ("Searching …"), cleared when done. */
  activity: string | null;
  blocks: Block[];
  followups: string[];
  error?: string;
};
export type AuraMsg = AuraUserMsg | AuraAssistantMsg;

export type AuraChat = {
  id: string;
  title: string;
  country: CountryCode;
  createdAt: number;
  updatedAt: number;
  messages: AuraMsg[];
  shown: Shown[];
  nextRef: number;
  /** "This chat remembers" chips. */
  chips: string[];
  /** "Not for me": hidden here and excluded from later searches. */
  hidden: Excluded[];
  /** Which result set the grid shows ("View Results"); the newest one by default. */
  activeSection: string | null;
  /** Products from outside the chat (feed, similar, brand) the shopper asked about, given refs here. */
  pinned: ShopifyCard[];
};

export type SavedItem = ShopifyCard & { country: CountryCode; savedAt: number };

type State = {
  chats: Record<string, AuraChat>;
  order: string[];
  country: CountryCode;
  saved: SavedItem[];
};
type Actions = {
  setCountry: (c: CountryCode) => void;
  newChat: (country: CountryCode) => string;
  deleteChat: (id: string) => void;
  addUser: (chatId: string, text: string) => void;
  addAssistant: (chatId: string) => string;
  apply: (chatId: string, msgId: string, e: FindsEvent) => void;
  finish: (chatId: string, msgId: string, error?: string) => void;
  hide: (chatId: string, p: ShopifyCard, reason: string) => void;
  toggleSave: (p: ShopifyCard, country: CountryCode) => void;
  setActiveSection: (chatId: string, sectionId: string) => void;
  /** Gives an outside product a ref in this chat (or returns the one it has). */
  pin: (chatId: string, p: ShopifyCard) => number;
};

const MAX_CHATS = 25;
const MAX_MESSAGES = 40;
const MAX_SAVED = 100;
const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

/** "[name](#12)" → "name", for user bubbles and titles. */
export const plainMentions = (t: string) => t.replace(/\[([^\]]+)\]\(#\d+\)/g, "$1");
const titleFrom = (t: string) => {
  const s = plainMentions(t).replace(/\s+/g, " ").trim();
  return s.length > 48 ? `${s.slice(0, 46)}…` : s || "New chat";
};
const priceText = (p: ShopifyCard, country: CountryCode) => (p.price ? `${p.priceFrom ? "from " : ""}${money(p.price, getCountry(country).locale)}` : "price on site");

function patch(chat: AuraChat, msgId: string, fn: (m: AuraAssistantMsg) => AuraAssistantMsg): AuraChat {
  return { ...chat, updatedAt: Date.now(), messages: chat.messages.map((m) => (m.id === msgId && m.role === "assistant" ? fn(m) : m)) };
}

export function reduce(chat: AuraChat, msgId: string, e: FindsEvent): AuraChat {
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
      const shown: Shown[] = e.products.flatMap((p) => (p.ref == null ? [] : [{ ref: p.ref, id: p.id, title: p.title, store: p.seller, price: priceText(p, chat.country) }]));
      return {
        ...next,
        // The newest result set takes over the grid.
        activeSection: e.products.length ? e.id : next.activeSection,
        shown: [...next.shown, ...shown].slice(-150),
        nextRef: Math.max(next.nextRef, ...shown.map((s) => s.ref + 1)),
      };
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

const KEY = "aura-chats";
/** Saved items and chats from Genuine Finds (Aura's predecessor) carry over on first load. */
const LEGACY_KEY = "genuine-finds-chats";

/** localStorage that survives quota errors and private mode. */
const safeStorage: StateStorage = {
  getItem: (k) => {
    try {
      return localStorage.getItem(k) ?? (k === KEY ? localStorage.getItem(LEGACY_KEY) : null);
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

export const useAura = create<State & Actions>()(
  persist(
    (set, get) => {
      const update = (chatId: string, fn: (c: AuraChat) => AuraChat) => {
        const c = get().chats[chatId];
        if (c) set({ chats: { ...get().chats, [chatId]: fn(c) } });
      };
      return {
        chats: {},
        order: [],
        country: "IN",
        saved: [],
        setCountry: (country) => set({ country }),
        newChat: (country) => {
          const id = uid();
          const now = Date.now();
          const chat: AuraChat = { id, title: "New chat", country, createdAt: now, updatedAt: now, messages: [], shown: [], nextRef: 1, chips: [], hidden: [], activeSection: null, pinned: [] };
          const order = [id, ...get().order].slice(0, MAX_CHATS);
          const chats = Object.fromEntries(order.map((k) => [k, k === id ? chat : get().chats[k]]).filter(([, c]) => c));
          set({ chats, order, country });
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
          update(chatId, (c) => ({ ...c, messages: [...c.messages, { id, role: "assistant" as const, at: Date.now(), status: "streaming" as const, activity: null, blocks: [], followups: [] }].slice(-MAX_MESSAGES) }));
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
        setActiveSection: (chatId, sectionId) => update(chatId, (c) => ({ ...c, activeSection: sectionId })),
        pin: (chatId, p) => {
          const c = get().chats[chatId];
          if (!c) return 0;
          const known = c.shown.find((s) => s.id === p.id);
          if (known) return known.ref;
          const ref = c.nextRef;
          update(chatId, (x) => ({
            ...x,
            nextRef: ref + 1,
            pinned: [...x.pinned, { ...p, ref }].slice(-40),
            shown: [...x.shown, { ref, id: p.id, title: p.title, store: p.seller, price: priceText(p, x.country) }].slice(-150),
          }));
          return ref;
        },
      };
    },
    {
      name: KEY,
      version: 3,
      storage: createJSONStorage(() => safeStorage),
      // v2 is Genuine Finds' shape: keep saved items, chats and country; add Aura's fields.
      migrate: (state, version) => {
        const s = state as State & { audience?: unknown };
        if (version < 3) {
          for (const c of Object.values(s.chats ?? {})) {
            Object.assign(c, { chips: c.chips ?? [], hidden: c.hidden ?? [], activeSection: c.activeSection ?? null, pinned: c.pinned ?? [] });
          }
          s.saved ??= [];
          delete s.audience;
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

/** Every product card a chat knows (its result sets plus pinned ones), by ref. */
export function cardsByRef(chat: AuraChat): Map<number, ShopifyCard> {
  const out = new Map<number, ShopifyCard>();
  for (const p of chat.pinned) if (p.ref != null) out.set(p.ref, p);
  for (const m of chat.messages) {
    if (m.role !== "assistant") continue;
    for (const b of m.blocks) if (b.kind === "section") for (const p of b.products) if (p.ref != null) out.set(p.ref, p);
  }
  return out;
}

/** What the model sees of an earlier assistant turn: its text plus which result sets it showed. */
export function historyText(m: AuraMsg): string {
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
