"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ProductDetail } from "@/components/shopify/ProductDetail";
import { useAura, type SavedItem } from "@/lib/shopify/aura/store";
import { getCountry } from "@/lib/shopify/countries";
import { TileActionsContext, ProductTile, type TileActions } from "./ProductTile";
import { Sheet, useHydrated } from "./ui";

/** Everything saved in Aura (this browser), grouped by the country it was priced in. */
export function AuraSaved() {
  const hydrated = useHydrated();
  const saved = useAura((s) => s.saved);
  const [quick, setQuick] = useState<SavedItem | null>(null);
  const groups = useMemo(() => {
    const by = new Map<string, SavedItem[]>();
    for (const s of hydrated ? saved : []) by.set(s.country, [...(by.get(s.country) ?? []), s]);
    return [...by.entries()];
  }, [hydrated, saved]);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-8 md:px-8">
      <h1 className="font-display text-4xl tracking-tight">Saved</h1>
      <p className="mt-1 text-sm text-ink-soft">Saved in this browser. Prices are from when you saved them; open one for the live price.</p>
      {hydrated && !saved.length && (
        <p className="mt-10 text-ink-soft">
          Nothing saved yet. Tap the heart on anything you like in{" "}
          <Link href="/aura" className="underline underline-offset-2">
            Shopify search
          </Link>
          .
        </p>
      )}
      {groups.map(([code, items]) => {
        const country = getCountry(code);
        const actions: TileActions = { country, onOpen: (p) => setQuick(items.find((x) => x.id === p.id) ?? null) };
        return (
          <TileActionsContext.Provider key={code} value={actions}>
            <section className="mt-8">
              {groups.length > 1 && (
                <h2 className="mb-3 text-sm text-ink-soft">
                  {country.flag} {country.name}
                </h2>
              )}
              <div className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 xl:grid-cols-4">
                {items.map((p, i) => (
                  <ProductTile key={p.id} p={p} index={i} />
                ))}
              </div>
            </section>
          </TileActionsContext.Provider>
        );
      })}
      <Sheet open={!!quick} onClose={() => setQuick(null)} title={quick?.seller ?? "Product"}>
        {quick && <ProductDetail key={quick.id} id={quick.id} country={getCountry(quick.country)} preview={quick} layout="sheet" />}
      </Sheet>
    </div>
  );
}
