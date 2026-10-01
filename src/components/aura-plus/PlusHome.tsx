"use client";

import { motion } from "framer-motion";
import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Sheet, useHydrated } from "@/components/shopify/aura/ui";
import type { ProductCard } from "@/lib/agent/types";
import { sendChatMessage } from "@/lib/chatClient";
import type { Example } from "@/lib/examples";
import { useChats } from "@/store/chats";
import { PlusFeed } from "./PlusFeed";
import { PlusProduct } from "./PlusProduct";
import { PlusActionsContext, type PlusActions } from "./PlusTile";

const short = (t: string) => (t.length > 40 ? `${t.slice(0, 38).trimEnd()}…` : t);

/** Aura++ home: Plush-style hero on Drape's Typesense catalog, example searches, and the personalised feed. */
export function PlusHome({ examples }: { examples: Example[] }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const [query, setQuery] = useState("");
  const [quick, setQuick] = useState<ProductCard | null>(null);

  /** Starts an Aura++ chat; `about` pins a feed product so the agent can answer about it. */
  const start = (text: string, about?: ProductCard) => {
    const { newChat, pin } = useChats.getState();
    const id = newChat(null, "aura");
    const ref = about ? pin(id, about) : null;
    void sendChatMessage(id, text, ref != null ? { refs: [ref] } : {});
    router.push(`/aura-plus/c/${id}`);
  };

  const actions = useMemo<PlusActions>(
    () => ({
      onOpen: setQuick,
      onAsk: (p, q) => start(`About ${short(p.title)}: ${q ?? "Tell me about it. Is it worth it?"}`, p),
      onMoreLike: (p) => start(`More like this: ${short(p.title)}`, p),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <PlusActionsContext.Provider value={actions}>
      <div className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(60%_50%_at_10%_20%,var(--color-accent-soft),transparent),radial-gradient(50%_50%_at_90%_60%,#f6efe6,transparent)] opacity-80" />
        <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-12 md:px-8 md:pt-20">
          <div className="mx-auto max-w-3xl text-center">
            <motion.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="font-display text-4xl leading-tight tracking-tight md:text-6xl">
              Style that speaks <em>your</em> language
            </motion.h1>
            <p className="mx-auto mt-4 max-w-md text-ink-soft">Describe what you&rsquo;re looking for in English, Hinglish or Hindi, and we&rsquo;ll curate tasteful results from our catalog.</p>
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
              maxLength={500}
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
            {examples.slice(0, 4).map((ex, i) => (
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

          <div className="mt-16">{hydrated && <PlusFeed />}</div>
        </div>
      </div>

      <Sheet open={!!quick} onClose={() => setQuick(null)} title={quick?.brand ?? "Product"}>
        {quick && <PlusProduct key={quick.id} p={quick} onOpen={setQuick} onAsk={(p) => actions.onAsk?.(p, null)} onMoreLike={actions.onMoreLike} />}
      </Sheet>
    </PlusActionsContext.Provider>
  );
}
