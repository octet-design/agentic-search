"use client";

/**
 * Scout's memory, by person, stored in this browser only. Facts are saved automatically from chat (each reply
 * offers "Undo") and can be viewed, edited and deleted in the Memory panel. Logic lives in lib/memory.ts.
 */
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { mergeFacts, personKey, undoFacts, type MemoryItem, type MemoryKind, type MemoryPerson, type SavedFact } from "@/lib/memory";

type State = { enabled: boolean; people: MemoryPerson[] };
type Actions = {
  /** Files facts heard in chat; returns what was saved (for "Undo"). */
  save: (items: MemoryItem[]) => SavedFact[];
  undo: (saved: SavedFact[]) => void;
  /** Adds a fact by hand from the Memory panel. */
  add: (person: string, kind: MemoryKind, text: string) => void;
  removeFact: (key: string, id: string) => void;
  removePerson: (key: string) => void;
  rename: (key: string, label: string) => void;
  setEnabled: (on: boolean) => void;
  clear: () => void;
};

const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

export const useMemory = create<State & Actions>()(
  persist(
    (set, get) => ({
      enabled: true,
      people: [],
      save: (items) => {
        if (!get().enabled || !items.length) return [];
        const { people, saved } = mergeFacts(get().people, items, Date.now(), uid);
        set({ people });
        return saved;
      },
      undo: (saved) => set((s) => ({ people: undoFacts(s.people, saved) })),
      add: (person, kind, text) => set((s) => ({ people: mergeFacts(s.people, [{ person, kind, text }], Date.now(), uid).people })),
      removeFact: (key, id) => set((s) => ({ people: s.people.map((p) => (p.key === key ? { ...p, facts: p.facts.filter((f) => f.id !== id) } : p)).filter((p) => p.facts.length) })),
      removePerson: (key) => set((s) => ({ people: s.people.filter((p) => p.key !== key) })),
      rename: (key, label) => set((s) => ({ people: s.people.map((p) => (p.key === key && label.trim() ? { ...p, label: label.trim().slice(0, 40) } : p)) })),
      setEnabled: (on) => set({ enabled: on }),
      clear: () => set({ people: [] }),
    }),
    { name: "scout.memory.v1", version: 1, storage: createJSONStorage(() => localStorage) },
  ),
);

/** Display label for a person typed in the panel ("mummy" → Mom). */
export const labelFor = (raw: string) => personKey(raw).label;
