"use client";

import { Fragment, type ReactNode } from "react";
import { ProductImage } from "@/components/product/ProductImage";

type RefLabel = (ref: number) => string | undefined;
/** The product behind a ref, so a mention can show as a small image card. */
type RefCard = (ref: number) => { title: string; image: string | null } | undefined;

/**
 * Minimal markdown for chat replies: paragraphs, **bold**, "- " bullets, and clickable product mentions.
 * Products are written as [name](#n); a bare #n is shown as the product's name when refLabel knows it,
 * so internal ref numbers never have to be visible.
 */
export function RichText({
  text,
  onRef,
  refLabel,
  refCard,
  className = "",
}: {
  text: string;
  onRef?: (ref: number) => void;
  refLabel?: RefLabel;
  refCard?: RefCard;
  className?: string;
}) {
  if (!text.trim()) return null;
  const blocks = tidyLinks(text).trim().split(/\n{2,}/);
  return (
    <div className={`space-y-2 leading-relaxed ${className}`}>
      {blocks.map((block, bi) => {
        const lines = block.split("\n");
        if (lines.every((l) => /^\s*[-•*]\s+/.test(l))) {
          return (
            <ul key={bi} className="list-disc space-y-1 pl-5">
              {lines.map((l, li) => (
                <li key={li}>{inline(l.replace(/^\s*[-•*]\s+/, ""), onRef, refLabel, refCard)}</li>
              ))}
            </ul>
          );
        }
        if (lines.length > 1 && lines.every((l) => /^\s*\d+[.)]\s+/.test(l))) {
          return (
            <ol key={bi} className="list-decimal space-y-1.5 pl-5">
              {lines.map((l, li) => (
                <li key={li}>{inline(l.replace(/^\s*\d+[.)]\s+/, ""), onRef, refLabel, refCard)}</li>
              ))}
            </ol>
          );
        }
        return (
          <p key={bi}>
            {lines.map((l, li) => (
              <Fragment key={li}>
                {li > 0 && <br />}
                {inline(l, onRef, refLabel, refCard)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

/**
 * The model sometimes wraps a product link in its own name: "[Name ([Name](#3))]" or "Name ([Name](#3))".
 * Keep just the link, which renders as the product card.
 */
export function tidyLinks(text: string): string {
  return text
    // A list item written as "1. Product name (#8): reason" → "1. [Product name](#8): reason".
    .replace(/^(\s*(?:\d+[.)]|[-•*])\s+)\**([^\n:()[\]]+?)\**\s*\(#(\d{1,3})\)/gm, "$1[$2](#$3)")
    .replace(/\[[^[\]\n]*\((\[[^\]\n]+\]\(#\d{1,3}\))\)\]/g, "$1")
    .replace(/\(\s*(\[[^\]\n]+\]\(#\d{1,3}\))\s*\)/g, "$1");
}

function inline(text: string, onRef?: (ref: number) => void, refLabel?: RefLabel, refCard?: RefCard): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\[[^\]\n]+\]\(#\d{1,3}\)|#\d{1,3}\b)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("**")) out.push(<strong key={k++}>{tok.slice(2, -2)}</strong>);
    else {
      const link = /^\[([^\]]+)\]\(#(\d+)\)$/.exec(tok);
      const n = Number(link ? link[2] : tok.slice(1));
      const label = link ? link[1] : (refLabel?.(n) ?? tok);
      const card = refCard?.(n);
      out.push(
        card && onRef ? (
          <button
            key={k++}
            type="button"
            onClick={() => onRef(n)}
            title={card.title}
            className="mx-0.5 inline-flex max-w-[16rem] items-center gap-1.5 rounded-full border border-line bg-paper py-0.5 pl-0.5 pr-2.5 align-middle text-sm font-medium leading-tight text-ink hover:border-ink"
          >
            <ProductImage src={card.image} alt="" className="h-6 w-6 shrink-0 overflow-hidden rounded-full" />
            <span className="truncate">{label}</span>
          </button>
        ) : onRef ? (
          <button key={k++} type="button" onClick={() => onRef(n)} className="font-semibold text-ink underline decoration-line decoration-2 underline-offset-2 hover:decoration-ink">
            {label}
          </button>
        ) : (
          <strong key={k++}>{label}</strong>
        ),
      );
    }
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}
