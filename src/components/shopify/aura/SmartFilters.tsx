"use client";

import { ArrowLeft, X } from "lucide-react";
import { useState } from "react";
import type { Refinement } from "@/lib/shopify/agent/types";
import { budgetPresets, composeFilterMessage } from "@/lib/shopify/aura/ux";
import type { Country } from "@/lib/shopify/countries";
import { money, toMinor } from "@/lib/shopify/format";

type Group = { question: string; options: string[]; single?: boolean };

const STATIC: Group[] = [
  { question: "What's the occasion?", options: ["Wedding", "Work", "Party", "Date night", "Festive", "Brunch", "Beach vacation", "Lounge", "Athleisure"] },
  { question: "How formal do you want it to feel?", options: ["Casual", "Smart casual", "Polished", "Formal"], single: true },
  { question: "Any fit preference?", options: ["Relaxed", "Fitted", "Oversized", "Flowy"] },
  { question: "Colour mood?", options: ["Neutrals", "Pastels", "Brights", "Black & white", "Earthy tones"] },
];

/**
 * Smart Filters: optional questions with tappable answers. "For this search" questions come from the agent's
 * latest search; picks are sent as one chat message ("Under ₹3,000, Ankle length, Loose waist").
 */
export function SmartFilters({
  country,
  refinements,
  onApply,
  onBack,
  onClose,
  header = true,
}: {
  country: Country;
  refinements: Refinement[];
  onApply: (message: string) => void;
  onBack: () => void;
  onClose?: () => void;
  /** False inside a Sheet that already has a title bar. */
  header?: boolean;
}) {
  const budget: Group = {
    question: "Do you have a budget in mind?",
    single: true,
    options: budgetPresets(country.currency).map((n) => `Under ${money({ amount: toMinor(n, country.currency), currency: country.currency }, country.locale)}`),
  };
  const groups: Group[] = [...refinements.map((r) => ({ question: r.question, options: r.options })), budget, ...STATIC];
  const [picked, setPicked] = useState<Record<string, string[]>>({});
  const count = Object.values(picked).flat().length;

  const toggle = (g: Group, o: string) =>
    setPicked((p) => {
      const cur = p[g.question] ?? [];
      const next = cur.includes(o) ? cur.filter((x) => x !== o) : g.single ? [o] : [...cur, o];
      return { ...p, [g.question]: next };
    });

  return (
    <div className="flex h-full min-h-0 flex-col">
      {header && <div className="flex items-center gap-3 border-b border-line px-4 py-3">
        <button onClick={onBack} className="rounded-full p-1 hover:bg-sand" aria-label="Back to chat">
          <ArrowLeft size={18} />
        </button>
        <h2 className="flex-1 font-medium">Smart Filters</h2>
        {onClose && (
          <button onClick={onClose} className="rounded-full p-1 hover:bg-sand" aria-label="Close">
            <X size={18} />
          </button>
        )}
      </div>}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <p className="text-sm text-ink-soft">
          Refine your search with any of these optional questions. Don&rsquo;t see what you need? Just{" "}
          <button onClick={onBack} className="font-medium text-ink underline underline-offset-2">
            go back to chat
          </button>{" "}
          and type your own words!
        </p>
        {groups.map((g, gi) => (
          <fieldset key={g.question} className="mt-6">
            <legend className="mb-2.5 text-[15px] font-medium">
              {g.question}
              {gi < refinements.length && <span className="ml-2 rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-normal text-accent">For this search</span>}
            </legend>
            <div className="flex flex-wrap gap-2">
              {g.options.map((o) => {
                const on = picked[g.question]?.includes(o);
                return (
                  <button
                    key={o}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggle(g, o)}
                    className={`border px-3.5 py-2 text-sm transition ${on ? "border-ink bg-ink text-canvas" : "border-line bg-paper hover:border-ink"}`}
                  >
                    {o}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>
      <div className="flex items-center gap-3 border-t border-line px-4 py-3">
        <button onClick={() => setPicked({})} disabled={!count} className="text-sm text-ink-soft hover:text-ink disabled:opacity-40">
          Clear
        </button>
        <button
          disabled={!count}
          onClick={() => onApply(composeFilterMessage(groups.map((g) => ({ question: g.question, picked: picked[g.question] ?? [] }))))}
          className="ml-auto bg-ink px-5 py-2.5 text-sm text-canvas disabled:opacity-40"
        >
          Show results{count ? ` (${count})` : ""}
        </button>
      </div>
    </div>
  );
}
