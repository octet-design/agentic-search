"use client";

import { motion } from "framer-motion";
import { Shuffle, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductDetails } from "@/components/product/ProductDetails";
import { ProductImage } from "@/components/product/ProductImage";
import { SearchBox } from "@/components/search/SearchBox";
import { Drawer } from "@/components/ui/Drawer";
import { useHydrated } from "@/hooks/useHydrated";
import { useTastePayload } from "@/hooks/useTaste";
import type { ProductCard as Card } from "@/lib/agent/types";
import type { Example } from "@/lib/examples";
import { cn, editHref } from "@/lib/format";
import { useSession, type AudienceKey } from "@/store/session";

const AUDIENCE_CHIPS: { label: string; value: AudienceKey[] }[] = [
  { label: "All", value: [] },
  { label: "Women", value: ["women"] },
  { label: "Men", value: ["men"] },
  { label: "Kids", value: ["girls", "boys"] },
];

export function HomeClient({ examples }: { examples: Example[] }) {
  const router = useRouter();
  const mounted = useHydrated();
  const audiences = useSession((s) => s.profile.audiences);
  const searches = useSession((s) => s.signals.searches);
  const liked = useSession((s) => s.signals.liked);
  const disliked = useSession((s) => s.signals.disliked);
  const setProfile = useSession((s) => s.setProfile);
  const taste = useTastePayload();
  const [surprising, setSurprising] = useState(false);
  const [forYouState, setForYou] = useState<{ key: string; products: Card[] } | null>(null);
  const [quick, setQuick] = useState<Card | null>(null);

  const likedKey = liked.map((p) => p.id).join(",");
  const forYou = liked.length >= 2 && forYouState?.key === likedKey ? forYouState.products : null;
  useEffect(() => {
    if (!mounted || liked.length < 2) return;
    fetch("/api/for-you", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ likedIds: liked.slice(-10).map((p) => p.id), excludeIds: disliked.map((d) => d.p.id) }),
    })
      .then((r) => (r.ok ? r.json() : { products: [] }))
      .then((j: { products: Card[] }) => setForYou({ key: likedKey, products: j.products }))
      .catch(() => setForYou({ key: likedKey, products: [] }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, likedKey]);

  const surprise = async () => {
    setSurprising(true);
    try {
      const r = await fetch("/api/surprise", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ taste, recent: searches }) });
      const j = (await r.json()) as { title: string; query: string };
      if (j.query) router.push(editHref(j.query, { surprise: j.title }));
    } finally {
      setSurprising(false);
    }
  };

  const selected = AUDIENCE_CHIPS.find((c) => c.value.join() === audiences.join())?.label ?? (audiences.length ? "" : "All");

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-24 pt-12 md:px-8 md:pt-20">
      <motion.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="font-display text-4xl leading-tight md:text-6xl">
        Tell me what you need.
        <br />
        <span className="text-ink-soft">I&apos;ll find what fits.</span>
      </motion.h1>
      <p className="mt-4 max-w-xl text-ink-soft">English, Hinglish or Hindi. Say what you love and what to avoid: every detail you give becomes a filter you can see and edit.</p>

      <div className="mt-8">
        <SearchBox />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {AUDIENCE_CHIPS.map((c) => (
          <button
            key={c.label}
            onClick={() => setProfile({ audiences: c.value })}
            aria-pressed={mounted && selected === c.label}
            className={cn("rounded-full border px-3 py-1 text-sm", mounted && selected === c.label ? "border-ink bg-ink text-canvas" : "border-line hover:border-ink")}
          >
            {c.label}
          </button>
        ))}
        <button onClick={surprise} disabled={surprising} className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-accent px-3 py-1 text-sm text-accent hover:bg-accent-soft disabled:opacity-50">
          <Shuffle size={14} /> {surprising ? "Picking…" : "Surprise me"}
        </button>
      </div>

      {mounted && searches.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-ink-faint">Recent</span>
          {[...searches].reverse().slice(0, 6).map((s) => (
            <Link key={s} href={editHref(s)} className="rounded-full bg-sand px-3 py-1 hover:bg-line">
              {s}
            </Link>
          ))}
        </div>
      )}

      {mounted && forYou && forYou.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-3 font-display text-2xl">For you</h2>
          <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2">
            {forYou.map((p, i) => (
              <ProductCard key={p.id} p={p} index={i} compact onOpen={setQuick} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-12">
        <h2 className="mb-4 font-display text-2xl">Try asking</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {examples.map((e, i) => (
            <motion.div key={e.query} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Link href={editHref(e.query)} className="group block overflow-hidden rounded-2xl bg-paper shadow-sm ring-1 ring-line transition hover:-translate-y-0.5">
                <div className="relative aspect-[4/5] overflow-hidden">
                  <ProductImage src={e.image} alt={e.title} className="h-full w-full transition duration-500 group-hover:scale-105" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 pt-10 text-white">
                    <div className="font-display text-lg leading-tight">{e.title}</div>
                  </div>
                </div>
                <p className="p-3 text-sm text-ink-soft">“{e.query}”</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      <Drawer open={!!quick} onClose={() => setQuick(null)} title={quick?.brand}>
        {quick && <ProductDetails p={quick} onOpen={setQuick} />}
      </Drawer>
      {mounted && audiences.length > 0 && selected === "" && (
        <p className="mt-6 inline-flex items-center gap-1 text-xs text-ink-faint">
          Shopping for: {audiences.join(", ")}
          <button onClick={() => setProfile({ audiences: [] })} aria-label="Clear audience">
            <X size={12} />
          </button>
        </p>
      )}
    </div>
  );
}
