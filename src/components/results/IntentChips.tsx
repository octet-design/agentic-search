"use client";

import { Plus, Sparkles, X } from "lucide-react";
import { useState } from "react";
import type { Chip, Intent } from "@/lib/agent/types";
import { cn } from "@/lib/format";

const AUDIENCES: { label: string; patch: Intent["audience"] }[] = [
  { label: "Women", patch: { segment: "women", kidGender: null, ageYears: null, source: "explicit" } },
  { label: "Men", patch: { segment: "men", kidGender: null, ageYears: null, source: "explicit" } },
  { label: "Girls", patch: { segment: "kids", kidGender: "girl", ageYears: null, source: "explicit" } },
  { label: "Boys", patch: { segment: "kids", kidGender: "boy", ageYears: null, source: "explicit" } },
];

/** The "I understood" row: every chip is editable/removable, plus "+ Add" (brief §6.1). */
export function IntentChips({
  chips,
  intent,
  personalized,
  onRemove,
  onIntent,
  onAdd,
}: {
  chips: Chip[];
  intent: Intent | null;
  personalized: string[];
  onRemove: (key: string) => void;
  onIntent: (next: Intent) => void;
  onAdd: (text: string) => void;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");

  const style = (c: Chip) =>
    c.kind === "exclude"
      ? "border-warn/30 bg-warn/5 text-warn"
      : c.kind === "soft"
        ? "border-dashed border-line text-ink-soft"
        : c.kind === "audience"
          ? "border-ink bg-ink text-canvas"
          : "border-line bg-paper";

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 text-xs uppercase tracking-wide text-ink-faint">I understood</span>
      {chips.map((c) => (
        <div key={c.key} className="relative">
          <span className={cn("inline-flex items-center gap-1 rounded-full border py-1 pl-3 pr-1 text-sm", style(c))}>
            <button
              type="button"
              className="focus-visible:outline-none"
              onClick={() => {
                if (c.key === "price") {
                  setMin(intent?.price?.min ? String(intent.price.min) : "");
                  setMax(intent?.price?.max ? String(intent.price.max) : "");
                }
                setEditing(editing === c.key ? null : c.key);
              }}
              aria-haspopup={c.key === "price" || c.key === "audience"}
            >
              {c.label}
            </button>
            <button type="button" onClick={() => onRemove(c.key)} aria-label={`Remove ${c.label}`} className="rounded-full p-0.5 opacity-60 hover:bg-black/5 hover:opacity-100">
              <X size={13} />
            </button>
          </span>
          {editing === c.key && c.key === "audience" && intent && (
            <div className="absolute left-0 top-9 z-20 flex gap-1 rounded-xl border border-line bg-paper p-1.5 shadow-lg">
              {AUDIENCES.map((a) => (
                <button
                  key={a.label}
                  className="rounded-lg px-2.5 py-1 text-sm hover:bg-sand"
                  onClick={() => {
                    setEditing(null);
                    onIntent({ ...intent, audience: a.patch, needsClarification: null });
                  }}
                >
                  {a.label}
                </button>
              ))}
            </div>
          )}
          {editing === c.key && c.key === "price" && intent && (
            <form
              className="absolute left-0 top-9 z-20 flex items-center gap-1.5 rounded-xl border border-line bg-paper p-2 shadow-lg"
              onSubmit={(e) => {
                e.preventDefault();
                setEditing(null);
                const lo = Number(min) || null;
                const hi = Number(max) || null;
                onIntent({ ...intent, price: lo || hi ? { min: lo, max: hi, strength: "must" } : null });
              }}
            >
              <input value={min} onChange={(e) => setMin(e.target.value)} inputMode="numeric" placeholder="Min ₹" className="w-20 rounded-md border border-line px-2 py-1 text-sm" aria-label="Minimum price" />
              <span className="text-ink-faint">–</span>
              <input value={max} onChange={(e) => setMax(e.target.value)} inputMode="numeric" placeholder="Max ₹" className="w-20 rounded-md border border-line px-2 py-1 text-sm" aria-label="Maximum price" />
              <button className="rounded-md bg-ink px-2 py-1 text-sm text-canvas">Apply</button>
            </form>
          )}
        </div>
      ))}
      {adding ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (text.trim()) onAdd(text.trim());
            setAdding(false);
            setText("");
          }}
        >
          <input
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={() => !text && setAdding(false)}
            placeholder="e.g. no polyester, under ₹3k"
            className="w-56 rounded-full border border-accent px-3 py-1 text-sm outline-none"
          />
        </form>
      ) : (
        <button type="button" onClick={() => setAdding(true)} className="inline-flex items-center gap-1 rounded-full border border-dashed border-line px-3 py-1 text-sm text-ink-soft hover:border-ink hover:text-ink">
          <Plus size={13} /> Add
        </button>
      )}
      {personalized.length > 0 && (
        <span className="group relative ml-1 inline-flex cursor-default items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-xs text-accent" tabIndex={0}>
          <Sparkles size={12} /> Personalized
          <span className="pointer-events-none absolute left-0 top-8 z-20 hidden w-64 rounded-lg border border-line bg-paper p-2 text-xs text-ink shadow-lg group-hover:block group-focus:block">
            {personalized.join(" · ")}
          </span>
        </span>
      )}
    </div>
  );
}
