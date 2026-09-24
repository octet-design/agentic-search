"use client";

import { Heart, Scale, UserRound } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { TastePanel } from "@/components/taste/TastePanel";
import { Onboarding } from "@/components/taste/Onboarding";
import { useHydrated } from "@/hooks/useHydrated";
import { APP_NAME } from "@/lib/config";
import { useSession } from "@/store/session";

export function Header() {
  const saved = useSession((s) => s.saved.length);
  const compare = useSession((s) => s.compare.length);
  const [tasteOpen, setTasteOpen] = useState(false);
  // Persisted counts are only known on the client; avoid hydration mismatch.
  const mounted = useHydrated();

  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-canvas/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 md:px-8">
        <Link href="/" className="font-display text-2xl tracking-tight">
          {APP_NAME}
        </Link>
        <nav className="ml-auto flex items-center gap-1 text-sm">
          <Link href="/saved" className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 hover:bg-sand">
            <Heart size={16} /> <span className="hidden sm:inline">Saved</span>
            {mounted && saved > 0 && <span className="rounded-full bg-accent px-1.5 text-xs text-white">{saved}</span>}
          </Link>
          {mounted && compare > 0 && (
            <Link href="/compare" className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 hover:bg-sand">
              <Scale size={16} /> <span className="hidden sm:inline">Compare</span>
              <span className="rounded-full bg-ink px-1.5 text-xs text-canvas">{compare}</span>
            </Link>
          )}
          <button onClick={() => setTasteOpen(true)} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 hover:bg-sand" aria-label="Your taste">
            <UserRound size={16} /> <span className="hidden sm:inline">Your taste</span>
          </button>
        </nav>
      </div>
      <TastePanel open={tasteOpen} onClose={() => setTasteOpen(false)} />
      <Onboarding />
    </header>
  );
}
