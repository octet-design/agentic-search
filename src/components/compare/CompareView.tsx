"use client";

import { ExternalLink, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ProductImage } from "@/components/product/ProductImage";
import { useHydrated } from "@/hooks/useHydrated";
import type { ProductCard } from "@/lib/agent/types";
import { inr, outboundUrl } from "@/lib/format";
import { useSession } from "@/store/session";

const cap = (s: string | null | undefined) => (s ? s.replace(/\b\w/g, (c) => c.toUpperCase()) : "—");

export function CompareView({ idsParam, query, criterion }: { idsParam?: string; query?: string; criterion?: string }) {
  const tray = useSession((s) => s.compare);
  const click = useSession((s) => s.click);
  const mounted = useHydrated();
  const ids = (idsParam ? idsParam.split(",") : mounted ? tray : []).filter(Boolean).slice(0, 3);
  const key = ids.join(",");
  // Results are keyed by the id list, so switching products shows the loader without resetting state.
  const [result, setResult] = useState<{ key: string; data?: { products: ProductCard[]; verdict: string[] }; error?: string } | null>(null);
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

  const rows: [string, (p: ProductCard) => React.ReactNode][] = [
    ["Price", (p) => <span className="font-semibold">{inr(p.price)}</span>],
    ["Brand", (p) => p.brand],
    ["Fabric", (p) => cap(p.fabric)],
    ["Fit", (p) => cap(p.fit)],
    ["Pattern", (p) => cap(p.pattern)],
    ["Colour", (p) => cap(p.color)],
    ["Sizes", (p) => (p.sizes.length ? p.sizes.slice(0, 10).join(", ") : "—")],
    ["Occasion", (p) => (p.useCase.length ? p.useCase.map(cap).join(", ") : "—")],
    [
      "Link",
      (p) => (
        <a href={outboundUrl(p.url)} target="_blank" rel="noopener noreferrer" onClick={() => click(p)} className="inline-flex items-center gap-1 text-accent hover:underline">
          {p.domain} <ExternalLink size={12} />
        </a>
      ),
    ],
  ];

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
        <>
          <div className="mt-6 rounded-2xl bg-accent-soft p-4">
            <h2 className="mb-2 font-display text-lg">Verdict</h2>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {data.verdict.map((v) => (
                <li key={v}>{v}</li>
              ))}
            </ul>
          </div>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[560px] table-fixed border-collapse text-sm">
              <thead>
                <tr>
                  <th className="w-24" />
                  {data.products.map((p, i) => (
                    <th key={p.id} className="p-2 text-left align-top font-normal">
                      <div className="text-xs text-ink-faint">{"ABC"[i]}</div>
                      <ProductImage src={p.image} alt={p.title} className="mt-1 aspect-[3/4] w-full rounded-xl" />
                      <div className="mt-2 line-clamp-2 font-medium">{p.title}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(([label, render]) => (
                  <tr key={label} className="border-t border-line">
                    <td className="p-2 text-ink-soft">{label}</td>
                    {data.products.map((p) => (
                      <td key={p.id} className="p-2 align-top">
                        {render(p)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
