"use client";

import { ShoppingBag } from "lucide-react";
import { ShopifyImage } from "@/components/shopify/ShopifyCard";
import type { CompareItem } from "@/lib/shopify/agent/types";
import type { Country } from "@/lib/shopify/countries";
import { money } from "@/lib/shopify/format";

/** Side-by-side comparison the agent produced with live details for each product. */
export function CompareBlock({ items, focus, country, onOpen }: { items: CompareItem[]; focus: string | null; country: Country; onOpen: (ref: number) => void }) {
  const optionNames = [...new Set(items.flatMap((i) => Object.keys(i.options)))].slice(0, 3);
  const rows: { label: string; cell: (i: CompareItem) => React.ReactNode }[] = [
    { label: "Price", cell: (i) => (i.price ? <span className="font-semibold">{money(i.price, country.locale)}</span> : "—") },
    { label: "Rating", cell: (i) => (i.rating ? `${i.rating.value.toFixed(1)}★${i.rating.count != null ? ` (${i.rating.count})` : ""}` : "No ratings") },
    { label: "Store", cell: (i) => i.store ?? "—" },
    ...optionNames.map((name) => ({ label: `${name} in stock`, cell: (i: CompareItem) => (i.options[name]?.length ? i.options[name].join(", ") : "—") })),
    { label: "Highlights", cell: (i) => (i.highlights.length ? <ul className="list-disc space-y-0.5 pl-4">{i.highlights.map((h) => <li key={h}>{h}</li>)}</ul> : "—") },
    {
      label: "Returns",
      cell: (i) =>
        i.returnsUrl ? (
          <a href={i.returnsUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-ink">
            Policy
          </a>
        ) : (
          "Not listed"
        ),
    },
  ];

  return (
    <section className="rounded-2xl border border-line bg-paper p-4 md:p-5">
      <h3 className="font-display text-lg leading-tight">Side by side{focus ? `: ${focus}` : ""}</h3>
      <div className="no-scrollbar mt-3 overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-sm">
          <thead>
            <tr>
              <th className="w-28" />
              {items.map((i) => (
                <th key={i.ref} className="px-2 pb-3 text-left align-top font-normal">
                  <button type="button" onClick={() => onOpen(i.ref)} className="flex flex-col gap-2 text-left">
                    <ShopifyImage src={i.image} alt={i.title} className="aspect-[3/4] w-24 rounded-lg" />
                    <span className="line-clamp-2 font-medium leading-snug hover:underline">{i.title}</span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-t border-line">
                <td className="py-2 pr-2 align-top text-xs uppercase tracking-wide text-ink-faint">{r.label}</td>
                {items.map((i) => (
                  <td key={i.ref} className="px-2 py-2 align-top text-ink-soft">
                    {r.cell(i)}
                  </td>
                ))}
              </tr>
            ))}
            <tr className="border-t border-line">
              <td />
              {items.map((i) => (
                <td key={i.ref} className="px-2 pt-3">
                  {i.buyUrl && i.available ? (
                    <a href={i.buyUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent/90">
                      <ShoppingBag size={13} /> Buy now
                    </a>
                  ) : (
                    <span className="text-xs text-ink-faint">Sold out</span>
                  )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
