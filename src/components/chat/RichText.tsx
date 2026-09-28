"use client";

import { Fragment, type ReactNode } from "react";

type RefLabel = (ref: number) => string | undefined;

/**
 * Minimal markdown for chat replies: paragraphs, **bold**, "- " bullets, and clickable product mentions.
 * Products are written as [name](#n); a bare #n is shown as the product's name when refLabel knows it,
 * so internal ref numbers never have to be visible.
 */
export function RichText({ text, onRef, refLabel, className = "" }: { text: string; onRef?: (ref: number) => void; refLabel?: RefLabel; className?: string }) {
  if (!text.trim()) return null;
  const blocks = text.trim().split(/\n{2,}/);
  return (
    <div className={`space-y-2 leading-relaxed ${className}`}>
      {blocks.map((block, bi) => {
        const lines = block.split("\n");
        if (lines.every((l) => /^\s*[-•*]\s+/.test(l))) {
          return (
            <ul key={bi} className="list-disc space-y-1 pl-5">
              {lines.map((l, li) => (
                <li key={li}>{inline(l.replace(/^\s*[-•*]\s+/, ""), onRef, refLabel)}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={bi}>
            {lines.map((l, li) => (
              <Fragment key={li}>
                {li > 0 && <br />}
                {inline(l, onRef, refLabel)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

function inline(text: string, onRef?: (ref: number) => void, refLabel?: RefLabel): ReactNode[] {
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
      out.push(
        onRef ? (
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
