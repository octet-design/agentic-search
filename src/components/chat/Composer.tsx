"use client";

import { ArrowUp, Square } from "lucide-react";
import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { cn } from "@/lib/format";

export type ComposerHandle = { insert: (text: string) => void; focus: () => void };

/** Chat input: Enter sends, Shift+Enter adds a line; a stop button while a reply streams. */
export const Composer = forwardRef<ComposerHandle, { onSend: (text: string) => void; onStop?: () => void; running?: boolean; placeholder?: string; autoFocus?: boolean; large?: boolean }>(
  function Composer({ onSend, onStop, running, placeholder = "Ask Drape anything…", autoFocus, large }, ref) {
    const [value, setValue] = useState("");
    const ta = useRef<HTMLTextAreaElement>(null);

    useImperativeHandle(ref, () => ({
      insert: (text) => {
        setValue((v) => (v ? `${v.trimEnd()} ${text}` : text));
        requestAnimationFrame(() => ta.current?.focus());
      },
      focus: () => ta.current?.focus(),
    }));

    const send = () => {
      const t = value.trim();
      if (!t || running) return;
      onSend(t);
      setValue("");
    };

    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="flex items-end gap-2 rounded-2xl border border-line bg-paper p-2 shadow-sm focus-within:border-ink"
      >
        <textarea
          ref={ta}
          value={value}
          autoFocus={autoFocus}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={large ? 2 : 1}
          placeholder={placeholder}
          aria-label="Message Drape"
          className={cn("max-h-40 min-h-0 flex-1 resize-none bg-transparent px-3 py-2 outline-none placeholder:text-ink-faint focus-visible:outline-none", large ? "text-lg" : "text-base")}
        />
        {running && onStop ? (
          <button type="button" onClick={onStop} className="rounded-full bg-ink p-2.5 text-canvas" aria-label="Stop">
            <Square size={16} fill="currentColor" />
          </button>
        ) : (
          <button type="submit" disabled={!value.trim() || running} className="rounded-full bg-ink p-2.5 text-canvas disabled:opacity-30" aria-label="Send">
            <ArrowUp size={18} />
          </button>
        )}
      </form>
    );
  },
);
