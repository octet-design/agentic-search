"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useHydrated } from "@/hooks/useHydrated";

/**
 * Right-side drawer on desktop, bottom sheet under md (brief §10). Portalled to <body>: an ancestor
 * with backdrop-filter (the sticky header) would otherwise become the containing block for `fixed`.
 */
export function Drawer({
  open,
  onClose,
  title,
  children,
  width = "md:w-[460px]",
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  width?: string;
}) {
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

  const hydrated = useHydrated();
  if (!hydrated) return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-ink/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            className={`fixed z-50 flex flex-col bg-paper shadow-2xl inset-x-0 bottom-0 max-h-[88vh] rounded-t-2xl md:inset-y-0 md:right-0 md:left-auto md:max-h-none md:rounded-none ${width}`}
            initial={{ y: "100%", x: 0 }}
            animate={{ y: 0, x: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-3">
              <div className="font-display text-lg">{title}</div>
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
