"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, Square, X } from "lucide-react";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";

const noop = () => () => {};

/** False during SSR/hydration, true after: gates localStorage-backed UI. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}

/** Right-side sheet on desktop, bottom sheet on mobile. Portalled so the sticky header can't trap `fixed`. */
export function Sheet({ open, onClose, title, children, wide = false }: { open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode; wide?: boolean }) {
  const hydrated = useHydrated();
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);
  if (!hydrated) return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 z-40 bg-ink/30" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.aside
            role="dialog"
            aria-modal="true"
            className={`fixed inset-x-0 bottom-0 z-50 flex max-h-[88vh] flex-col rounded-t-2xl bg-paper shadow-2xl md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:rounded-none ${wide ? "md:w-[min(1040px,92vw)]" : "md:w-[520px]"}`}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-3">
              <div className="min-w-0 truncate font-display text-lg">{title}</div>
              <button onClick={onClose} className="rounded-full p-2 hover:bg-sand" aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export type ComposerHandle = { focus: () => void };

/** Enter sends, Shift+Enter adds a line; a stop button while a reply streams. */
export const Composer = forwardRef<ComposerHandle, { onSend: (t: string) => void; onStop?: () => void; running?: boolean; placeholder: string; autoFocus?: boolean; large?: boolean }>(
  function Composer({ onSend, onStop, running, placeholder, autoFocus, large }, ref) {
    const [value, setValue] = useState("");
    const ta = useRef<HTMLTextAreaElement>(null);
    useImperativeHandle(ref, () => ({ focus: () => ta.current?.focus() }));
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
          maxLength={1000}
          placeholder={placeholder}
          aria-label="Message"
          className={`max-h-40 min-h-0 flex-1 resize-none bg-transparent px-3 py-2 outline-none placeholder:text-ink-faint focus-visible:outline-none ${large ? "text-lg" : "text-base"}`}
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
