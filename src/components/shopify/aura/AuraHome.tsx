"use client";

import { motion } from "framer-motion";
import { Lightbulb, Search, SlidersHorizontal, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ProductDetail } from "@/components/shopify/ProductDetail";
import { sendAuraMessage } from "@/lib/shopify/aura/send";
import { useAura } from "@/lib/shopify/aura/store";
import { COUNTRIES, getCountry, isCountryCode } from "@/lib/shopify/countries";
import type { ShopifyCard } from "@/lib/shopify/types";
import { Feed } from "./Feed";
import { TileActionsContext, type TileActions } from "./ProductTile";
import { SmartFilters } from "./SmartFilters";
import { Sheet, useHydrated } from "./ui";

export type Example = { query: string; image: string | null };

const SURPRISE = [
  "Breezy linen co-ord set for a beach holiday",
  "Statement earrings for a sangeet night",
  "Old-money look for a weekend brunch",
  "Comfortable block heels I can dance in",
  "Pastel kurta set with mirror work",
  "Minimal leather tote that fits a laptop",
  "Western wear for women",
  "Smart-casual outfit for a first day at work",
  "Cosy oversized knit for winter evenings",
  "White sneakers that go with everything",
];

const short = (t: string) => (t.length > 40 ? `${t.slice(0, 38).trimEnd()}…` : t).replace(/[[\]]/g, "");

/** Aura home: "Style that speaks your language" hero, example searches, and the personalised feed. */
export function AuraHome({ examples }: { examples: Example[] }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const stored = useAura((s) => s.country);
  const setCountry = useAura((s) => s.setCountry);
  const country = getCountry(hydrated ? stored : "IN");
  const [query, setQuery] = useState("");
  const [quick, setQuick] = useState<ShopifyCard | null>(null);
  const [filters, setFilters] = useState(false);

  /** Starts a chat; `about` pins a product from the feed so the agent can look it up. */
  const start = (text: string | ((ref: (p: ShopifyCard) => string) => string)) => {
    const { newChat, pin } = useAura.getState();
    const id = newChat(country.code);
    const message = typeof text === "string" ? text : text((p) => `[${short(p.title)}](#${pin(id, p)})`);
    void sendAuraMessage(id, message);
    router.push(`/aura/c/${id}`);
  };

  const actions = useMemo<TileActions>(
    () => ({
      country,
      onOpen: setQuick,
      onAsk: (p, q) => start((m) => `About ${m(p)}: ${q ?? "Tell me about it. Is it worth it?"}`),
      onMoreLike: (p) => start((m) => `More like this: ${m(p)}`),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [country],
  );

  return (
    <TileActionsContext.Provider value={actions}>
      <div className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(60%_50%_at_10%_20%,var(--color-accent-soft),transparent),radial-gradient(50%_50%_at_90%_60%,#f6efe6,transparent)] opacity-80" />
        <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-10 md:px-8 md:pt-16">
          <div className="flex justify-end">
            <label className="inline-flex items-center gap-2 text-xs text-ink-soft">
              Shopping in
              <select value={country.code} onChange={(e) => isCountryCode(e.target.value) && setCountry(e.target.value)} className="rounded-full border border-line bg-paper/80 px-2.5 py-1 text-xs text-ink" aria-label="Country">
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.name} · {c.currency}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mx-auto max-w-3xl text-center">
            <motion.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="font-display text-4xl leading-tight tracking-tight md:text-6xl">
              Style that speaks <em>your</em> language
            </motion.h1>
            <p className="mx-auto mt-4 max-w-md text-ink-soft">Describe what you&rsquo;re looking for, and let Aura curate tasteful results from stores across Shopify.</p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (query.trim()) start(query.trim());
            }}
            className="mx-auto mt-10 flex max-w-3xl items-center gap-3 bg-paper px-5 py-4 shadow-[0_10px_40px_rgba(0,0,0,0.08)]"
          >
            <Search size={20} className="shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Describe what you're looking for…"
              aria-label="Search"
              maxLength={300}
              autoFocus
              className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-ink-faint md:text-lg"
            />
            {query && (
              <button type="button" onClick={() => setQuery("")} aria-label="Clear" className="rounded-full p-1 hover:bg-sand">
                <X size={18} />
              </button>
            )}
          </form>

          <div className="mx-auto mt-6 grid max-w-3xl gap-3 sm:grid-cols-2">
            {examples.map((ex, i) => (
              <motion.button
                key={ex.query}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i }}
                onClick={() => start(ex.query)}
                className={`group flex h-24 items-center gap-4 overflow-hidden text-left transition hover:shadow-md ${["bg-[#e9e2d6]", "bg-[#ecebe6]", "bg-[#efe4e2]", "bg-[#ebebeb]"][i % 4]}`}
              >
                {ex.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={ex.image} alt="" referrerPolicy="no-referrer" className="h-full w-24 shrink-0 object-cover transition duration-300 group-hover:scale-105" />
                ) : (
                  <span className="h-full w-24 shrink-0 bg-sand" />
                )}
                <span className="pr-4 text-sm leading-snug">&ldquo;{ex.query}&rdquo;</span>
              </motion.button>
            ))}
          </div>

          <div className="mt-6 flex justify-center gap-3">
            <button onClick={() => start(SURPRISE[Math.floor(Math.random() * SURPRISE.length)])} className="inline-flex items-center gap-2 border border-line bg-paper px-4 py-2.5 text-sm font-medium hover:border-ink">
              <Lightbulb size={16} /> Surprise me
            </button>
            <button onClick={() => setFilters(true)} className="inline-flex items-center gap-2 border border-line bg-paper px-4 py-2.5 text-sm font-medium hover:border-ink">
              <SlidersHorizontal size={16} /> Smart filters
            </button>
          </div>

          <div className="mt-16">{hydrated && <Feed key={country.code} country={country} />}</div>
        </div>
      </div>

      <Sheet open={!!quick} onClose={() => setQuick(null)} title={quick?.seller ?? "Product"}>
        {quick && (
          <div>
            <ProductDetail key={quick.id} id={quick.id} country={country} preview={quick} layout="sheet" onOpenSimilar={setQuick} />
            <div className="sticky bottom-0 flex gap-2 border-t border-line bg-paper px-5 py-3">
              <button onClick={() => actions.onAsk?.(quick, null)} className="flex-1 border border-line px-3 py-2 text-sm hover:border-ink">
                Ask Aura about this
              </button>
              <button onClick={() => actions.onMoreLike?.(quick)} className="flex-1 bg-ink px-3 py-2 text-sm text-canvas">
                More like this
              </button>
            </div>
          </div>
        )}
      </Sheet>

      <Sheet open={filters} onClose={() => setFilters(false)} title="Smart Filters">
        {filters && (
          <SmartFilters
            country={country}
            refinements={[]}
            header={false}
            onBack={() => setFilters(false)}
            onApply={(m) => {
              setFilters(false);
              start(`Show me fashion for: ${m}`);
            }}
          />
        )}
      </Sheet>
    </TileActionsContext.Provider>
  );
}
