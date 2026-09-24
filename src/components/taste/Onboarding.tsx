"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useHydrated } from "@/hooks/useHydrated";
import { ProductImage } from "@/components/product/ProductImage";
import { cn } from "@/lib/format";
import { useSession, type AudienceKey } from "@/store/session";

type Tile = { id: string; label: string; image: string | null };

const BUDGETS = [
  { label: "Under ₹1k", min: undefined, max: 1000 },
  { label: "₹1k–3k", min: 1000, max: 3000 },
  { label: "₹3k–7k", min: 3000, max: 7000 },
  { label: "₹7k+", min: 7000, max: undefined },
];

/** 4-step, skippable, first-visit setup (brief §8.5). Reopened from the taste panel. */
export function Onboarding() {
  const profile = useSession((s) => s.profile);
  const open = useSession((s) => s.onboardingOpen);
  const { setProfile, setOnboardingOpen } = useSession.getState();
  const [step, setStep] = useState(0);
  const [tiles, setTiles] = useState<Tile[] | null>(null);

  // First visit: open once the persisted state has loaded.
  useEffect(() => {
    const t = setTimeout(() => {
      const s = useSession.getState();
      if (!s.profile.onboarded && !s.signals.searches.length) setOnboardingOpen(true);
    }, 600);
    return () => clearTimeout(t);
  }, [setOnboardingOpen]);

  useEffect(() => {
    if (open && step === 1 && !tiles) {
      fetch("/api/style-tiles")
        .then((r) => (r.ok ? r.json() : { tiles: [] }))
        .then((j: { tiles: Tile[] }) => setTiles(j.tiles))
        .catch(() => setTiles([]));
    }
  }, [open, step, tiles]);

  const finish = () => {
    setProfile({ onboarded: true });
    setOnboardingOpen(false);
    setStep(0);
  };

  const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const hydrated = useHydrated();
  if (!hydrated) return null;
  // Portalled: it's mounted inside the sticky header, whose backdrop-filter would trap `fixed`.
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 md:items-center md:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Quick setup"
            initial={{ y: 40 }}
            animate={{ y: 0 }}
            exit={{ y: 40 }}
            className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-paper md:rounded-3xl"
          >
            <div className="flex items-center justify-between px-6 pt-5">
              <span className="text-xs uppercase tracking-wide text-ink-faint">Step {step + 1} of 4 · about 30 seconds</span>
              <button onClick={finish} className="inline-flex items-center gap-1 text-sm text-ink-soft hover:text-ink">
                Skip <X size={14} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {step === 0 && (
                <>
                  <h2 className="font-display text-2xl">Who are you shopping for?</h2>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {(["women", "men", "girls", "boys"] as AudienceKey[]).map((a) => (
                      <button
                        key={a}
                        onClick={() => setProfile({ audiences: toggle(profile.audiences, a) })}
                        className={cn("rounded-2xl border px-4 py-5 text-left text-lg capitalize", profile.audiences.includes(a) ? "border-ink bg-ink text-canvas" : "border-line hover:border-ink")}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                </>
              )}
              {step === 1 && (
                <>
                  <h2 className="font-display text-2xl">Pick 3 or more you like</h2>
                  <div className="mt-4 grid grid-cols-3 gap-2 md:grid-cols-4">
                    {(tiles ?? Array.from({ length: 12 }, (_, i) => ({ id: String(i), label: "", image: null }))).map((t) => {
                      const on = profile.styles.includes(t.id);
                      return (
                        <button
                          key={t.id}
                          disabled={!tiles}
                          onClick={() => setProfile({ styles: toggle(profile.styles, t.id) })}
                          className={cn("relative overflow-hidden rounded-xl text-left ring-2", on ? "ring-accent" : "ring-transparent")}
                          aria-pressed={on}
                        >
                          {tiles ? <ProductImage src={t.image} alt={t.label} className="aspect-[3/4] w-full" /> : <div className="skeleton aspect-[3/4] w-full" />}
                          <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 p-2 pt-6 text-xs font-medium text-white">{t.label}</span>
                          {on && (
                            <span className="absolute right-1.5 top-1.5 rounded-full bg-accent p-1 text-white">
                              <Check size={12} />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
              {step === 2 && (
                <>
                  <h2 className="font-display text-2xl">Your sizes (optional)</h2>
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    {(["top", "bottom", "footwear"] as const).map((k) => (
                      <label key={k} className="flex flex-col gap-1 text-sm capitalize text-ink-soft">
                        {k}
                        <input
                          value={profile.sizes[k] ?? ""}
                          onChange={(e) => setProfile({ sizes: { ...profile.sizes, [k]: e.target.value || undefined } })}
                          placeholder={k === "footwear" ? "UK 7" : k === "bottom" ? "32" : "M"}
                          className="rounded-lg border border-line px-3 py-2 text-base text-ink"
                        />
                      </label>
                    ))}
                  </div>
                </>
              )}
              {step === 3 && (
                <>
                  <h2 className="font-display text-2xl">Usual budget per item</h2>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {BUDGETS.map((b) => {
                      const on = profile.budget?.min === b.min && profile.budget?.max === b.max;
                      return (
                        <button key={b.label} onClick={() => setProfile({ budget: on ? null : { min: b.min, max: b.max } })} className={cn("rounded-full border px-4 py-2", on ? "border-ink bg-ink text-canvas" : "border-line hover:border-ink")}>
                          {b.label}
                        </button>
                      );
                    })}
                  </div>
                  <input
                    type="range"
                    min={500}
                    max={15000}
                    step={500}
                    value={profile.budget?.max ?? 3000}
                    onChange={(e) => setProfile({ budget: { min: profile.budget?.min, max: Number(e.target.value) } })}
                    className="mt-6 w-full accent-[var(--color-accent)]"
                    aria-label="Maximum budget"
                  />
                  <p className="text-sm text-ink-soft">Up to ₹{(profile.budget?.max ?? 3000).toLocaleString("en-IN")} · used as a preference, never a hard filter</p>
                </>
              )}
            </div>
            <div className="flex items-center justify-between border-t border-line px-6 py-4">
              <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} className="text-sm text-ink-soft disabled:opacity-0">
                Back
              </button>
              <button onClick={() => (step < 3 ? setStep(step + 1) : finish())} className="rounded-full bg-ink px-6 py-2 text-sm text-canvas">
                {step < 3 ? "Next" : "Done"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
