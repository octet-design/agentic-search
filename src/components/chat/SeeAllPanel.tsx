"use client";

import { ArrowLeft, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { ProductCard, ProductSkeleton } from "@/components/product/ProductCard";
import { ProductDetails } from "@/components/product/ProductDetails";
import { Drawer } from "@/components/ui/Drawer";
import type { ProductCard as Card } from "@/lib/agent/types";
import type { ChatSection } from "@/store/chats";

const PAGE = 24;

type Load = { status: "loading" } | { status: "error"; message: string } | { status: "done"; products: Card[] };

/**
 * "See all" for a chat section: more products with exactly the section's filters, in a wide panel over the
 * chat. No re-interpretation and no taste, so it's the same list the chat showed, just longer.
 */
export function SeeAllPanel({ section, hidden, onClose }: { section: ChatSection | null; hidden: Set<string>; onClose: () => void }) {
  return (
    <Drawer open={!!section} onClose={onClose} title={section?.title} width="md:w-[min(1040px,92vw)]">
      {section && <PanelBody key={section.id} section={section} hidden={hidden} />}
    </Drawer>
  );
}

function PanelBody({ section, hidden }: { section: ChatSection; hidden: Set<string> }) {
  const [load, setLoad] = useState<Load>({ status: "loading" });
  const [shown, setShown] = useState(PAGE);
  const [open, setOpen] = useState<Card | null>(null);

  useEffect(() => {
    const ac = new AbortController();
    fetch("/api/chat/section", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intent: section.intent }),
      signal: ac.signal,
    })
      .then(async (res) => {
        const body = (await res.json().catch(() => null)) as { products?: Card[]; message?: string } | null;
        if (!res.ok || !body?.products) throw new Error(body?.message ?? `Request failed (${res.status})`);
        // The chat's picks lead, in the same order, so the panel continues what the user just saw.
        const lead = section.products.filter((p) => body.products!.some((x) => x.id === p.id));
        const leadIds = new Set(lead.map((p) => p.id));
        setLoad({ status: "done", products: [...lead, ...body.products.filter((p) => !leadIds.has(p.id))] });
      })
      .catch((err) => {
        if (!ac.signal.aborted) setLoad({ status: "error", message: err instanceof Error ? err.message : "Something went wrong." });
      });
    return () => ac.abort();
  }, [section]);

  if (open) {
    return (
      <div>
        <button onClick={() => setOpen(null)} className="mx-5 mt-4 inline-flex items-center gap-1 text-sm text-ink-soft hover:text-ink">
          <ArrowLeft size={14} /> Back to all {section.title.toLowerCase()}
        </button>
        <ProductDetails p={open} onOpen={setOpen} />
      </div>
    );
  }

  const products = load.status === "done" ? load.products.filter((p) => !hidden.has(p.id)) : [];
  return (
    <div className="p-5">
      {section.why && <p className="mb-4 text-sm text-ink-soft">{section.why}</p>}
      {load.status === "error" && <p className="rounded-xl border border-warn/30 bg-warn/5 px-3 py-2 text-sm text-warn">{load.message}</p>}
      <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
        {load.status === "loading"
          ? Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)
          : products.slice(0, shown).map((p, i) => <ProductCard key={p.id} p={p} index={i % PAGE} onOpen={setOpen} />)}
      </div>
      {load.status === "done" && products.length === 0 && <p className="py-10 text-center text-sm text-ink-soft">Nothing more in stock for this one.</p>}
      {load.status === "done" && (
        <div className="mt-6 flex flex-col items-center gap-2 text-sm text-ink-soft">
          <span>
            Showing {Math.min(shown, products.length)} of {products.length}
          </span>
          {shown < products.length && (
            <button onClick={() => setShown((n) => n + PAGE)} className="rounded-full border border-line bg-paper px-5 py-2 text-ink hover:border-ink">
              Load more
            </button>
          )}
        </div>
      )}
      {load.status === "loading" && (
        <p className="mt-4 inline-flex items-center gap-2 text-sm text-ink-soft">
          <Loader2 size={14} className="animate-spin text-accent" /> Finding more…
        </p>
      )}
    </div>
  );
}
