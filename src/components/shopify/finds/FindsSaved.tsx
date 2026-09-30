"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ProductDetail } from "@/components/shopify/ProductDetail";
import { useFinds, type SavedItem } from "@/lib/shopify/chat/store";
import { getCountry } from "@/lib/shopify/countries";
import { FindsLayout } from "./FindsLayout";
import { CardActionsContext, FindsCard, type CardActions } from "./Products";
import { Sheet, useHydrated } from "./ui";

/** Everything saved in Genuine Finds (this browser), grouped by the country it was priced in. */
export function FindsSaved() {
  const hydrated = useHydrated();
  const saved = useFinds((s) => s.saved);
  const [quick, setQuick] = useState<SavedItem | null>(null);
  const groups = useMemo(() => {
    const by = new Map<string, SavedItem[]>();
    for (const s of hydrated ? saved : []) by.set(s.country, [...(by.get(s.country) ?? []), s]);
    return [...by.entries()];
  }, [hydrated, saved]);

  return (
    <FindsLayout title="Saved">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 md:px-8">
          <h1 className="font-display text-3xl">Your saved finds</h1>
          <p className="mt-1 text-sm text-ink-soft">Saved in this browser. Prices are from when you saved them; open one for the live price.</p>
          {hydrated && !saved.length && (
            <p className="mt-10 text-ink-soft">
              Nothing saved yet. Tap the heart on any product in a{" "}
              <Link href="/finds" className="underline underline-offset-2">
                chat
              </Link>
              .
            </p>
          )}
          {groups.map(([code, items]) => {
            const country = getCountry(code);
            const actions: CardActions = { country, onOpen: (p) => setQuick(items.find((x) => x.id === p.id) ?? null) };
            return (
              <CardActionsContext.Provider key={code} value={actions}>
                <section className="mt-8">
                  {groups.length > 1 && (
                    <h2 className="mb-3 text-sm text-ink-soft">
                      {country.flag} {country.name}
                    </h2>
                  )}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
                    {items.map((p, i) => (
                      <FindsCard key={p.id} p={p} index={i} wide />
                    ))}
                  </div>
                </section>
              </CardActionsContext.Provider>
            );
          })}
        </div>
      </div>
      <Sheet open={!!quick} onClose={() => setQuick(null)} title={quick?.seller ?? "Product"}>
        {quick && <ProductDetail key={quick.id} id={quick.id} country={getCountry(quick.country)} preview={quick} layout="sheet" />}
      </Sheet>
    </FindsLayout>
  );
}
