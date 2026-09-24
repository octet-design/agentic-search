"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useHydrated } from "@/hooks/useHydrated";
import { takeImage } from "@/lib/image";
import { ResultsView } from "./ResultsView";

/** Reads the photo stashed by the search box (sessionStorage) and runs image search. */
export function ImageResultsView({ text, debug }: { text: string; debug: boolean }) {
  const hydrated = useHydrated();
  const image = useMemo(() => (hydrated ? takeImage() : undefined), [hydrated]);
  if (image === undefined) return null;
  if (!image) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <p className="font-display text-2xl">That photo is no longer here.</p>
        <p className="mt-2 text-ink-soft">Photos stay in this browser tab only. Upload it again from the search box.</p>
        <Link href="/" className="mt-6 inline-block rounded-full bg-ink px-5 py-2 text-sm text-canvas">
          Back to search
        </Link>
      </div>
    );
  }
  return <ResultsView query={text} debug={debug} image={image} />;
}
