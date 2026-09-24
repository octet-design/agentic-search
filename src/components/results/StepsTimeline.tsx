"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import { useState } from "react";
import type { StepState } from "@/hooks/useAgentStream";

/** Animated agent steps while running; collapses to "4 steps · 3.1s" once done. */
export function StepsTimeline({ steps, running, totalMs }: { steps: StepState[]; running: boolean; totalMs?: number }) {
  const [open, setOpen] = useState(false);
  if (!steps.length) return null;
  const expanded = running || open;
  return (
    <div className="text-sm">
      {!running && (
        <button onClick={() => setOpen((o) => !o)} className="inline-flex items-center gap-1 text-ink-soft hover:text-ink" aria-expanded={open}>
          <Check size={14} className="text-ok" />
          {steps.length} steps{totalMs ? ` · ${(totalMs / 1000).toFixed(1)}s` : ""}
          <ChevronDown size={14} className={open ? "rotate-180 transition" : "transition"} />
        </button>
      )}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.ol
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-2 flex flex-col gap-1.5 overflow-hidden"
            aria-live="polite"
          >
            {steps.map((s) => (
              <motion.li key={s.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2">
                {s.status === "running" ? (
                  <Loader2 size={14} className="animate-spin text-accent" />
                ) : (
                  <Check size={14} className="text-ok" />
                )}
                <span className={s.status === "running" ? "text-ink" : "text-ink-soft"}>{s.label}</span>
                {s.detail && <span className="truncate text-xs text-ink-faint">· {s.detail}</span>}
                {s.ms != null && <span className="text-xs text-ink-faint">{(s.ms / 1000).toFixed(1)}s</span>}
              </motion.li>
            ))}
          </motion.ol>
        )}
      </AnimatePresence>
    </div>
  );
}
