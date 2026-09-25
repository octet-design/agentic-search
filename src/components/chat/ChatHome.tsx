"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductDetails } from "@/components/product/ProductDetails";
import { Drawer } from "@/components/ui/Drawer";
import { useHydrated } from "@/hooks/useHydrated";
import { useTaste, useTasteSeeds } from "@/hooks/useTaste";
import type { ProductCard as Card } from "@/lib/agent/types";
import { sendChatMessage } from "@/lib/chatClient";
import { useChats } from "@/store/chats";
import { useSession } from "@/store/session";
import { ChatLayout } from "./ChatLayout";
import { Composer } from "./Composer";

const STARTERS = [
  "Office casual wear that's comfortable",
  "What should I wear to a mehendi in Jaipur in November?",
  "Old-money look for men",
  "Gift for my dad's 60th under ₹3,000",
  "Goa trip outfits for a guy, ₹6,000 total",
  "Birthday party dress for my 6-year-old daughter",
];

/** New chat: greeting, composer, starters and For you. The chat is created on the first message. */
export function ChatHome() {
  const router = useRouter();
  const hydrated = useHydrated();
  const newChat = useChats((s) => s.newChat);
  const seeds = useTasteSeeds();
  const taste = useTaste();
  const disliked = useSession((s) => s.signals.disliked);
  const [forYou, setForYou] = useState<{ key: string; products: Card[] } | null>(null);
  const [quick, setQuick] = useState<Card | null>(null);
  const likedKey = seeds.join(",");

  useEffect(() => {
    if (!hydrated || seeds.length < 2) return;
    fetch("/api/for-you", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ likedIds: seeds, excludeIds: disliked.map((d) => d.p.id), k: 12 }),
    })
      .then((r) => (r.ok ? r.json() : { products: [] }))
      .then((j: { products: Card[] }) => setForYou({ key: likedKey, products: j.products }))
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, likedKey]);

  const start = (text: string) => {
    const id = newChat();
    void sendChatMessage(id, text);
    router.push(`/chat/${id}`);
  };

  const picks = seeds.length >= 2 && forYou?.key === likedKey ? forYou.products : [];
  // Proactive starters from learned taste ("More navy straight kurtas…").
  const personal = hydrated && !taste.empty ? personalStarters(taste) : [];

  return (
    <ChatLayout>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-3xl flex-col px-4 pb-16 pt-8 md:px-8 md:pt-24">
          <motion.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="font-display text-4xl leading-tight md:text-5xl">
            What are you shopping for?
          </motion.h1>
          <p className="mt-3 text-ink-soft">Tell me the occasion, the vibe or the exact piece. I&apos;ll suggest what to wear, show real options and answer your questions.</p>
          <div className="mt-8">
            <Composer onSend={start} autoFocus large placeholder="e.g. office casual wear that's comfortable, no polyester" />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {personal.map((s) => (
              <button key={s} onClick={() => start(s)} className="rounded-full border border-accent/40 bg-accent-soft px-3 py-1.5 text-sm text-accent hover:border-accent">
                ✦ {s}
              </button>
            ))}
            {STARTERS.map((s) => (
              <button key={s} onClick={() => start(s)} className="rounded-full border border-line bg-paper px-3 py-1.5 text-sm hover:border-ink">
                {s}
              </button>
            ))}
          </div>

          {picks.length > 0 && (
            <section className="mt-14">
              <h2 className="mb-3 font-display text-2xl">For you</h2>
              <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2">
                {picks.map((p, i) => (
                  <ProductCard key={p.id} p={p} index={i} compact onOpen={setQuick} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
      <Drawer open={!!quick} onClose={() => setQuick(null)} title={quick?.brand}>
        {quick && <ProductDetails p={quick} onOpen={setQuick} />}
      </Drawer>
    </ChatLayout>
  );
}

function personalStarters(t: ReturnType<typeof useTaste>): string[] {
  const out: string[] = [];
  const cat = t.categories[0];
  const color = t.colors[0];
  if (cat) out.push(`More ${color ? `${color} ` : ""}${cat} like the ones I looked at`);
  if (t.brands[0]) out.push(`Something new from ${t.brands[0].replace(/\b\w/g, (c) => c.toUpperCase())}`);
  return out.slice(0, 2);
}
