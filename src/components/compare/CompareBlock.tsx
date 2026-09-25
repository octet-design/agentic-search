"use client";

import { Check, CheckCheck, ExternalLink, Minus, Star } from "lucide-react";
import { ProductImage } from "@/components/product/ProductImage";
import type { CompareBlockData, ProductCard } from "@/lib/agent/types";
import { cn, inr, outboundUrl } from "@/lib/format";
import { useSession } from "@/store/session";

const LETTERS = ["A", "B", "C"];
const cap = (s: string | null | undefined) => (s ? s.replace(/\b\w/g, (c) => c.toUpperCase()) : "—");

const FIT = {
  great: { label: "Great", icon: CheckCheck, cls: "text-ok bg-ok/10" },
  ok: { label: "OK", icon: Check, cls: "text-amber-700 bg-amber-50" },
  poor: { label: "Not ideal", icon: Minus, cls: "text-ink-faint bg-sand" },
} as const;

/** Table + occasion matrix + text verdict. Used inline in chat and on /compare. */
export function CompareBlock({ data, onOpen }: { data: CompareBlockData; onOpen?: (p: ProductCard) => void }) {
  const click = useSession((s) => s.click);
  const n = data.products.length;
  const cols = { gridTemplateColumns: `8rem repeat(${n}, minmax(9rem, 1fr))` };
  const label = (i: number) => (data.products[i].ref != null ? `#${data.products[i].ref}` : LETTERS[i]);

  const rows: [string, (p: ProductCard) => React.ReactNode][] = [
    ["Price", (p) => <span className="font-semibold">{inr(p.price)}</span>],
    ["Brand", (p) => p.brand],
    ["Fabric", (p) => cap(p.fabric)],
    ["Fit", (p) => cap(p.fit)],
    ["Pattern", (p) => cap(p.pattern)],
    ["Colour", (p) => cap(p.color)],
  ];

  return (
    <div className="rounded-2xl border border-line bg-paper p-4">
      {data.summary && <p className="mb-3 text-sm text-ink-soft">{data.summary}</p>}
      <div className="overflow-x-auto">
        <div className="min-w-fit text-sm">
          <div className="grid gap-2" style={cols}>
            <div />
            {data.products.map((p, i) => (
              <button key={p.id} type="button" onClick={() => onOpen?.(p)} className="text-left">
                <div className="relative overflow-hidden rounded-xl">
                  <ProductImage src={p.image} alt={p.title} className="aspect-[3/4] w-full" />
                  <span className="absolute left-2 top-2 rounded-full bg-ink/85 px-2 py-0.5 text-xs font-semibold text-canvas">{label(i)}</span>
                </div>
                <div className="mt-1.5 line-clamp-2 font-medium leading-snug">{p.title}</div>
              </button>
            ))}
          </div>
          {rows.map(([name, render]) => (
            <div key={name} className="grid items-center gap-2 border-t border-line py-2" style={cols}>
              <div className="text-ink-soft">{name}</div>
              {data.products.map((p) => (
                <div key={p.id}>{render(p)}</div>
              ))}
            </div>
          ))}

          {data.occasions.length > 0 && (
            <>
              <div className="mt-3 border-t border-line pt-3 text-xs uppercase tracking-wide text-ink-faint">Best for which occasion</div>
              {data.occasions.map((o) => (
                <div key={o.occasion} className="grid items-start gap-2 border-t border-line/60 py-2" style={cols}>
                  <div className="font-medium">{o.occasion}</div>
                  {o.fits.map((f, i) => {
                    const F = FIT[f.fit];
                    return (
                      <div key={i} className={cn("rounded-lg px-2 py-1.5", o.best === i && "ring-1 ring-accent")}>
                        <span className={cn("inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-xs font-medium", F.cls)}>
                          <F.icon size={12} /> {F.label}
                          {o.best === i && <Star size={11} className="fill-accent text-accent" />}
                        </span>
                        {f.note && <div className="mt-1 text-xs leading-snug text-ink-soft">{f.note}</div>}
                      </div>
                    );
                  })}
                </div>
              ))}
            </>
          )}

          <div className="grid items-center gap-2 border-t border-line py-2" style={cols}>
            <div className="text-ink-soft">Shop</div>
            {data.products.map((p) => (
              <a key={p.id} href={outboundUrl(p.url)} target="_blank" rel="noopener noreferrer" onClick={() => click(p)} className="inline-flex items-center gap-1 text-accent hover:underline">
                {p.domain} <ExternalLink size={12} />
              </a>
            ))}
          </div>
        </div>
      </div>
      {data.verdict.length > 0 && (
        <div className="mt-3 rounded-xl bg-accent-soft p-3">
          <div className="mb-1 font-display">Verdict</div>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {data.verdict.map((v) => (
              <li key={v}>{v.replace(/\b([ABC])\b/g, (_, l: string) => label(LETTERS.indexOf(l)))}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
