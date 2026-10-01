"use client";

import { useEffect, useState } from "react";
import { loaderProgress } from "@/lib/shopify/aura/ux";

/**
 * "Finding your perfect look…": a 0→100% counter in a circle. Time eases it forward; real stream progress
 * (thinking → searching → results) lifts it, and results snap it to 100.
 */
export function Loader({ startedAt, stage, activity }: { startedAt: number; stage: 0 | 1 | 2 | 3; activity: string | null }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 120);
    return () => clearInterval(t);
  }, []);
  const pct = loaderProgress(Math.max(0, now - startedAt), stage);
  const r = 56;
  const c = 2 * Math.PI * r;

  return (
    <div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-6 px-6 text-center" role="status" aria-live="polite">
      <div className="relative h-32 w-32">
        <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90">
          <circle cx="64" cy="64" r={r} fill="none" stroke="var(--color-line)" strokeWidth="2" />
          <circle
            cx="64"
            cy="64"
            r={r}
            fill="none"
            stroke="var(--color-ink)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - pct / 100)}
            className="transition-[stroke-dashoffset] duration-150 ease-linear"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-display text-4xl tabular-nums">{pct}%</span>
      </div>
      <div>
        <p className="font-display text-3xl tracking-tight md:text-4xl">Finding your perfect look…</p>
        <p className="mt-2 h-5 text-sm text-ink-soft">{activity && activity !== "Thinking…" ? activity : "Reading your request"}</p>
      </div>
    </div>
  );
}
