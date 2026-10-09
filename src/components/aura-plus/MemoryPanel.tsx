"use client";

import { Brain, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { Sheet, useHydrated } from "@/components/shopify/aura/ui";
import { MEMORY_KINDS, type MemoryKind } from "@/lib/memory";
import { useMemory } from "@/store/memory";

const KIND_LABEL: Record<MemoryKind, string> = { size: "Size", avoid: "Avoids", likes: "Likes", budget: "Budget", other: "Note" };

/** Scout's "Memory" button: opens what Scout remembers, by person. */
export function MemoryButton({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const hydrated = useHydrated();
  const count = useMemory((s) => s.people.reduce((n, p) => n + p.facts.length, 0));
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm ${className}`} aria-label="What Scout remembers">
        <Brain size={16} /> Memory{hydrated && count > 0 ? ` · ${count}` : ""}
      </button>
      <MemoryPanel open={open} onClose={() => setOpen(false)} />
    </>
  );
}

/** What Scout remembers, grouped by person: view, edit, delete, add, or turn memory off. */
export function MemoryPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { enabled, people } = useMemory();
  const { setEnabled, removeFact, removePerson, rename, add, clear } = useMemory.getState();
  const [renaming, setRenaming] = useState<string | null>(null);
  const [draft, setDraft] = useState({ person: "Me", kind: "likes" as MemoryKind, text: "" });

  return (
    <Sheet open={open} onClose={onClose} title="What Scout remembers">
      <div className="flex flex-col gap-5 p-5">
        <p className="text-sm text-ink-soft">
          Scout remembers lasting things you tell it, about you and the people you shop for, and uses only that person&apos;s notes when you shop for them. Saved in
          this browser only.
        </p>

        <label className="flex items-center justify-between gap-3 rounded-xl border border-line px-4 py-3 text-sm">
          <span>
            <span className="font-medium">Memory</span>
            <span className="block text-ink-soft">{enabled ? "On: Scout saves and uses notes." : "Off: nothing is saved or used."}</span>
          </span>
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="h-5 w-5 accent-[var(--color-accent)]" />
        </label>

        {people.length === 0 ? (
          <p className="rounded-xl bg-sand/60 p-4 text-sm text-ink-soft">
            Nothing yet. Tell Scout things like &ldquo;I wear size M&rdquo; or &ldquo;my mom loves cotton sarees&rdquo; and they&apos;ll show up here.
          </p>
        ) : (
          people.map((p) => (
            <section key={p.key} className="rounded-xl border border-line">
              <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
                {renaming === p.key ? (
                  <input
                    autoFocus
                    defaultValue={p.label}
                    onBlur={(e) => (rename(p.key, e.target.value), setRenaming(null))}
                    onKeyDown={(e) => e.key === "Enter" && (e.currentTarget as HTMLInputElement).blur()}
                    className="min-w-0 flex-1 border-b border-ink bg-transparent font-medium outline-none"
                  />
                ) : (
                  <h3 className="flex-1 font-medium">{p.label}</h3>
                )}
                {p.key !== "self" && (
                  <button type="button" onClick={() => setRenaming(p.key)} aria-label={`Rename ${p.label}`} className="rounded-full p-1 text-ink-soft hover:bg-sand">
                    <Pencil size={14} />
                  </button>
                )}
                <button type="button" onClick={() => removePerson(p.key)} aria-label={`Forget everything about ${p.label}`} className="rounded-full p-1 text-ink-soft hover:bg-sand">
                  <Trash2 size={14} />
                </button>
              </div>
              <ul className="divide-y divide-line/60">
                {p.facts.map((f) => (
                  <li key={f.id} className="flex items-start gap-2 px-4 py-2 text-sm">
                    <span className="mt-0.5 shrink-0 rounded-full bg-sand px-2 py-0.5 text-[11px] font-medium text-ink-soft">{KIND_LABEL[f.kind]}</span>
                    <span className="flex-1">{f.text}</span>
                    <button type="button" onClick={() => removeFact(p.key, f.id)} aria-label={`Forget: ${f.text}`} className="rounded-full p-0.5 text-ink-faint hover:bg-sand hover:text-ink">
                      <X size={13} />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!draft.text.trim()) return;
            add(draft.person.trim() || "Me", draft.kind, draft.text.trim());
            setDraft((d) => ({ ...d, text: "" }));
          }}
          className="flex flex-col gap-2 rounded-xl border border-dashed border-line p-4"
        >
          <span className="text-sm font-medium">Add a note</span>
          <div className="flex gap-2">
            <input
              value={draft.person}
              onChange={(e) => setDraft((d) => ({ ...d, person: e.target.value }))}
              list="memory-people"
              placeholder="Who (Me, Mom, Riya…)"
              className="w-32 rounded-lg border border-line bg-paper px-2.5 py-1.5 text-sm"
            />
            <datalist id="memory-people">
              {["Me", ...people.filter((p) => p.key !== "self").map((p) => p.label)].map((l) => (
                <option key={l} value={l} />
              ))}
            </datalist>
            <select value={draft.kind} onChange={(e) => setDraft((d) => ({ ...d, kind: e.target.value as MemoryKind }))} className="rounded-lg border border-line bg-paper px-2 py-1.5 text-sm">
              {MEMORY_KINDS.map((k) => (
                <option key={k} value={k}>
                  {KIND_LABEL[k]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <input
              value={draft.text}
              onChange={(e) => setDraft((d) => ({ ...d, text: e.target.value }))}
              placeholder="e.g. Wears size L in kurtas"
              maxLength={160}
              className="min-w-0 flex-1 rounded-lg border border-line bg-paper px-2.5 py-1.5 text-sm"
            />
            <button type="submit" disabled={!draft.text.trim()} className="inline-flex items-center gap-1 rounded-full bg-ink px-3 py-1.5 text-sm text-canvas disabled:opacity-40">
              <Plus size={14} /> Add
            </button>
          </div>
        </form>

        {people.length > 0 && (
          <button type="button" onClick={() => clear()} className="self-start text-sm text-warn hover:underline">
            Forget everything
          </button>
        )}
      </div>
    </Sheet>
  );
}
