"use client";

import { Fragment, type ReactNode } from "react";
import { ShopifyImage } from "@/components/shopify/ShopifyCard";
import type { Country } from "@/lib/shopify/countries";
import type { ShopifyCard } from "@/lib/shopify/types";
import { priceLabel, Rating } from "./Products";

type Ctx = { onRef: (ref: number) => void; card: (ref: number) => ShopifyCard | undefined; country: Country };

const BULLET = /^\s*[-•*]\s+/;
/** "[name](#12) | headline | why | tip" (the prompt's pick format; the tip is optional). */
const PICK = /^\[([^\]]+)\]\(#(\d{1,4})\)\s*\|\s*(.*)$/;

/**
 * Minimal markdown for answers: paragraphs, **bold**, "- " bullets, product links written as [name](#n),
 * and pick bullets rendered as "My picks for you" cards.
 */
export function RichText({ text, ...ctx }: { text: string } & Ctx) {
  if (!text.trim()) return null;
  return (
    <div className="space-y-3 text-[15px] leading-relaxed">
      {text
        .trim()
        .split(/\n{2,}/)
        .map((block, bi) => {
          const lines = block.split("\n").filter((l) => l.trim());
          if (lines.length && lines.every((l) => BULLET.test(l))) {
            const items = lines.map((l) => l.replace(BULLET, ""));
            if (items.some((l) => PICK.test(l))) return <Picks key={bi} items={items} {...ctx} />;
            return (
              <ul key={bi} className="list-disc space-y-1.5 pl-5">
                {items.map((l, li) => (
                  <li key={li}>{inline(l, ctx)}</li>
                ))}
              </ul>
            );
          }
          return (
            <p key={bi}>
              {lines.map((l, li) => (
                <Fragment key={li}>
                  {li > 0 && <br />}
                  {inline(l, ctx)}
                </Fragment>
              ))}
            </p>
          );
        })}
    </div>
  );
}

function Picks({ items, ...ctx }: { items: string[] } & Ctx) {
  return (
    <section className="rounded-2xl border border-line bg-paper p-4 md:p-5">
      <h3 className="font-display text-lg leading-tight">My picks for you</h3>
      <ol className="mt-3 flex flex-col divide-y divide-line">
        {items.map((line, i) => {
          const m = PICK.exec(line);
          const p = m ? ctx.card(Number(m[2])) : undefined;
          if (!m || !p) {
            return (
              <li key={i} className="py-3">
                {inline(line, ctx)}
              </li>
            );
          }
          const [headline, why, ...tip] = m[3].split("|").map((s) => s.trim());
          return (
            <li key={i} className="flex gap-4 py-4 first:pt-1 last:pb-1">
              <button type="button" onClick={() => ctx.onRef(p.ref!)} className="w-24 shrink-0 overflow-hidden rounded-xl bg-sand md:w-28" aria-label={`Open ${p.title}`}>
                <ShopifyImage src={p.image} alt={p.title} className="aspect-[3/4] w-full" />
              </button>
              <div className="min-w-0 flex-1">
                {headline && (
                  <div className="text-xs font-medium uppercase tracking-wide text-accent">
                    {i + 1}. {headline}
                  </div>
                )}
                <button type="button" onClick={() => ctx.onRef(p.ref!)} className="mt-0.5 text-left font-medium leading-snug hover:underline">
                  {m[1]}
                </button>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm text-ink-soft">
                  <span>{p.seller ?? "Online store"}</span>·<span className="font-semibold text-ink">{priceLabel(p, ctx.country)}</span>
                  <Rating r={p.rating} />
                </div>
                {why && <p className="mt-2 text-[15px] leading-relaxed">{inline(why, ctx)}</p>}
                {tip.join(" | ") && (
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                    <span className="font-medium text-ink">Style tip:</span> {inline(tip.join(" | ").replace(/^(style )?tip:\s*/i, ""), ctx)}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function inline(text: string, ctx: Ctx): ReactNode[] {
  const out: ReactNode[] = [];
  // [name](#12), a stray "(#12)" / "#12", and **bold**.
  const re = /(\*\*[^*]+\*\*|\[[^\]\n]+\]\(#\d{1,4}\)|\(#\d{1,4}\)|#\d{1,4}\b)/g;
  let last = 0;
  let k = 0;
  for (let m = re.exec(text); m; m = re.exec(text)) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("**")) {
      out.push(<strong key={k++}>{tok.slice(2, -2)}</strong>);
    } else {
      const link = /^\[([^\]]+)\]\(#(\d+)\)$/.exec(tok);
      const n = Number(link ? link[2] : tok.replace(/[^\d]/g, ""));
      const p = ctx.card(n);
      if (!link) {
        // A bare "(#12)" usually follows the product's name already: show a small link, not the name again.
        if (p)
          out.push(
            <button key={k++} type="button" onClick={() => ctx.onRef(n)} className="mx-0.5 rounded-full border border-line px-1.5 text-xs text-ink-soft hover:border-ink hover:text-ink">
              view
            </button>,
          );
        else out.push(tok);
      } else
        out.push(
          <button key={k++} type="button" onClick={() => ctx.onRef(n)} className="font-semibold text-ink underline decoration-line decoration-2 underline-offset-2 hover:decoration-ink">
            {link[1]}
          </button>,
        );
    }
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}
