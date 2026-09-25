"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useHydrated } from "@/hooks/useHydrated";
import type { CompareBlockData } from "@/lib/agent/types";
import { useSession } from "@/store/session";
import { CompareBlock } from "./CompareBlock";

export function CompareView({ idsParam, query, criterion }: { idsParam?: string; query?: string; criterion?: string }) {
  const tray = useSession((s) => s.compare);
  const mounted = useHydrated();
  const ids = (idsParam ? idsParam.split(",") : mounted ? tray : []).filter(Boolean).slice(0, 3);
  const key = ids.join(",");
  // Results are keyed by the id list, so switching products shows the loader without resetting state.
  const [result, setResult] = useState<{ key: string; data?: CompareBlockData; error?: string } | null>(null);
  const data = result?.key === key ? (result.data ?? null) : null;
  const error = result?.key === key ? (result.error ?? null) : null;

  useEffect(() => {
    if (ids.length < 2) return;
    fetch("/api/compare", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids, query, criterion }) })
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.message);
        setResult({ key, data: j });
      })
      .catch((e: Error) => setResult({ key, error: e.message }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, query, criterion]);

  if (mounted && ids.length < 2) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <p className="font-display text-2xl">Pick 2–3 products to compare.</p>
        <p className="mt-2 text-ink-soft">Tick “Compare” on any product card.</p>
        <Link href="/" className="mt-6 inline-block rounded-full bg-ink px-5 py-2 text-sm text-canvas">
          Start searching
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-8">
      <h1 className="font-display text-3xl">Compare</h1>
      {query && <p className="mt-1 text-sm text-ink-soft">For “{query}”</p>}
      {error && <p className="mt-6 text-warn">{error}</p>}
      {!data && !error && (
        <p className="mt-6 inline-flex items-center gap-2 text-ink-soft">
          <Loader2 size={16} className="animate-spin" /> Weighing them up…
        </p>
      )}
      {data && (
        <div className="mt-6">
          <CompareBlock data={data} />
        </div>
      )}
    </div>
  );
}
