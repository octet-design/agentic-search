"use client";

import { SlidersHorizontal } from "lucide-react";
import type { SmartFilter } from "@/lib/agent/types";

/** One bar built from the result set; clicking a value updates the same Intent the chips show. */
export function SmartFilters({ filters, onPick }: { filters: SmartFilter[]; onPick: (f: SmartFilter, optionId: string) => void }) {
  if (!filters.length) return null;
  return (
    <div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 py-1 text-sm">
      <SlidersHorizontal size={16} className="mt-1.5 shrink-0 text-ink-faint" aria-hidden />
      {filters.map((f) => (
        <div key={f.field} className="flex shrink-0 items-center gap-1.5">
          <span className="text-xs uppercase tracking-wide text-ink-faint">{f.label}</span>
          {f.options.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => onPick(f, o.id)}
              className="whitespace-nowrap rounded-full border border-line bg-paper px-2.5 py-1 hover:border-ink"
            >
              {o.label} <span className="text-ink-faint">{o.count}</span>
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
