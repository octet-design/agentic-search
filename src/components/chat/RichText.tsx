"use client";

import { Fragment, type ReactNode } from "react";

/** Minimal markdown for chat replies: paragraphs, **bold**, "- " bullets, and clickable #n product refs. */
export function RichText({ text, onRef, className = "" }: { text: string; onRef?: (ref: number) => void; className?: string }) {
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
                <li key={li}>{inline(l.replace(/^\s*[-•*]\s+/, ""), onRef)}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={bi}>
            {lines.map((l, li) => (
              <Fragment key={li}>
                {li > 0 && <br />}
                {inline(l, onRef)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

function inline(text: string, onRef?: (ref: number) => void): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|#\d{1,3}\b)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("**")) out.push(<strong key={k++}>{tok.slice(2, -2)}</strong>);
    else {
      const n = Number(tok.slice(1));
      out.push(
        onRef ? (
          <button key={k++} type="button" onClick={() => onRef(n)} className="rounded bg-sand px-1 font-semibold text-ink hover:bg-line">
            {tok}
          </button>
        ) : (
          <strong key={k++}>{tok}</strong>
        ),
      );
    }
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}
