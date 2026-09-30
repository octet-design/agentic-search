"use client";

import { motion } from "framer-motion";
import { BadgeCheck, ChevronRight, Globe2, Lock, Store } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ProductDetail } from "@/components/shopify/ProductDetail";
import { sendFindsMessage } from "@/lib/shopify/chat/send";
import { useFinds } from "@/lib/shopify/chat/store";
import { AGENT_TAGLINE, AUDIENCES, type Audience } from "@/lib/shopify/config";
import { COUNTRIES, getCountry, isCountryCode } from "@/lib/shopify/countries";
import type { ShopifyCard } from "@/lib/shopify/types";
import { FindsLayout } from "./FindsLayout";
import { CardActionsContext, FindsCard, type CardActions } from "./Products";
import { Composer, Sheet, useHydrated } from "./ui";

const STARTERS: Record<Audience | "any", string[]> = {
  any: ["Office wear that's comfortable", "Linen shirt and chinos for a beach wedding", "White sneakers that go with everything", "Minimal leather tote for work", "Wedding guest outfit", "Everyday watch under a budget"],
  women: ["Office wear that's comfortable, no polyester", "Wedding guest outfit", "Block heels I can walk in all day", "Minimal leather tote for work", "Cotton kurta sets for summer", "Everyday gold-tone jewellery"],
  men: ["Old-money look", "Linen shirt and chinos for a beach wedding", "White sneakers that go with everything", "Everyday watch under a budget", "Kurta for a festive dinner", "Smart-casual office outfit"],
  girls: ["Birthday party dress for a 6-year-old", "Comfortable cotton sets for school holidays", "Festive lehenga for a little girl", "Everyday sneakers for kids"],
  boys: ["Birthday party outfit for a 5-year-old boy", "Kurta pyjama set for a wedding", "Comfortable shorts and tees for summer", "Everyday sneakers for kids"],
};

const PROMISES = [
  { icon: Store, text: "Real fashion from real online stores" },
  { icon: BadgeCheck, text: "Live prices, ratings and store policies" },
  { icon: Lock, text: "You check out on the store's own site" },
];

const short = (t: string) => (t.length > 36 ? `${t.slice(0, 34).trimEnd()}…` : t);

/** New chat: promise, shopping-for + country pickers, composer, starters and your saved finds. */
export function FindsHome() {
  const router = useRouter();
  const hydrated = useHydrated();
  const storedCountry = useFinds((s) => s.country);
  const storedAudience = useFinds((s) => s.audience);
  const saved = useFinds((s) => s.saved);
  const setCountry = useFinds((s) => s.setCountry);
  const setAudience = useFinds((s) => s.setAudience);
  const newChat = useFinds((s) => s.newChat);
  const [quick, setQuick] = useState<ShopifyCard | null>(null);
  const country = getCountry(hydrated ? storedCountry : "IN");
  const audience = hydrated ? storedAudience : null;

  const start = (text: string) => {
    const id = newChat(country.code, audience);
    void sendFindsMessage(id, text);
    router.push(`/finds/${id}`);
  };

  const mine = hydrated ? saved.filter((s) => s.country === country.code) : [];
  // Proactive starters from what they saved.
  const personal = mine.slice(0, 2).map((s, i) => (i === 0 ? `What goes with the ${short(s.title)} I saved?` : `More like the ${short(s.title)} I saved`));
  const actions = useMemo<CardActions>(() => ({ country, onOpen: setQuick }), [country]);

  return (
    <CardActionsContext.Provider value={actions}>
      <FindsLayout>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto flex max-w-3xl flex-col px-4 pb-16 pt-8 md:px-8 md:pt-20">
            <motion.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="font-display text-4xl leading-tight md:text-5xl">
              Find it. Know it&rsquo;s genuine.
            </motion.h1>
            <p className="mt-3 text-ink-soft">{AGENT_TAGLINE}</p>
            <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-soft">
              {PROMISES.map(({ icon: Icon, text }) => (
                <li key={text} className="inline-flex items-center gap-1.5">
                  <Icon size={15} className="text-ok" /> {text}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Shopping for">
              <span className="mr-1 text-sm text-ink-soft">Shopping for</span>
              {AUDIENCES.map((a) => {
                const on = audience === a.id;
                return (
                  <button
                    key={a.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setAudience(on ? null : a.id)}
                    className={`rounded-full border px-3.5 py-1.5 text-sm transition ${on ? "border-ink bg-ink text-canvas" : "border-line bg-paper hover:border-ink"}`}
                  >
                    {a.label}
                  </button>
                );
              })}
              {hydrated && !audience && <span className="text-xs text-ink-faint">Anyone (I&apos;ll work it out from your message)</span>}
            </div>

            <label className="mt-3 inline-flex w-fit items-center gap-2 text-sm text-ink-soft">
              <Globe2 size={15} /> Shopping in
              <select
                value={country.code}
                onChange={(e) => isCountryCode(e.target.value) && setCountry(e.target.value)}
                className="rounded-full border border-line bg-paper px-3 py-1.5 text-sm text-ink hover:border-ink focus:border-ink"
                aria-label="Country"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.name} · {c.currency}
                  </option>
                ))}
              </select>
              <span className="text-xs text-ink-faint">Stores that deliver to {country.name}, prices in {country.currency}</span>
            </label>

            <div className="mt-4">
              <Composer onSend={start} autoFocus large placeholder="Describe what you need: the piece, the occasion, your budget…" />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {personal.map((s) => (
                <button key={s} onClick={() => start(s)} className="rounded-full border border-accent/40 bg-accent-soft px-3 py-1.5 text-sm text-accent hover:border-accent">
                  ✦ {s}
                </button>
              ))}
              {STARTERS[audience ?? "any"].map((s) => (
                <button key={s} onClick={() => start(s)} className="rounded-full border border-line bg-paper px-3 py-1.5 text-sm hover:border-ink">
                  {s}
                </button>
              ))}
            </div>

            {mine.length > 0 && (
              <section className="mt-14">
                <div className="mb-3 flex items-end justify-between">
                  <h2 className="font-display text-2xl">Your saved finds</h2>
                  <Link href="/finds/saved" className="inline-flex items-center gap-1 text-sm text-ink-soft hover:text-ink">
                    See all <ChevronRight size={14} />
                  </Link>
                </div>
                <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2">
                  {mine.slice(0, 12).map((p, i) => (
                    <FindsCard key={p.id} p={p} index={i} />
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
        <Sheet open={!!quick} onClose={() => setQuick(null)} title={quick?.seller ?? "Product"}>
          {quick && (
            <ProductDetail
              key={quick.id}
              id={quick.id}
              country={country}
              preview={quick}
              layout="sheet"
              onOpenSimilar={setQuick}
            />
          )}
        </Sheet>
      </FindsLayout>
    </CardActionsContext.Provider>
  );
}
