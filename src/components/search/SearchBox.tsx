"use client";

import { ArrowUp, Camera } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FEATURES } from "@/lib/config";
import { cn, editHref } from "@/lib/format";
import { resizeImage, stashImage } from "@/lib/image";

const PLACEHOLDERS = [
  "What do I wear to a mehendi in Jaipur in November?",
  "Office kurta sets in cotton under ₹2,000",
  "shaadi ke liye sherwani, ivory ya beige",
  "Birthday party dress for my 6-year-old",
  "Monsoon-proof everyday footwear",
  "Old-money look for men",
  "Floral maxi dress, no polyester",
];

export function SearchBox({ initial = "", compact = false }: { initial?: string; compact?: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState(initial);
  const [ph, setPh] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [imgError, setImgError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value) return;
    const t = setInterval(() => setPh((p) => (p + 1) % PLACEHOLDERS.length), 3000);
    return () => clearInterval(t);
  }, [value]);

  const submit = () => {
    const q = value.trim();
    if (q) router.push(editHref(q));
  };

  const onImage = async (file: File | undefined) => {
    if (!file) return;
    setImgError(null);
    try {
      const dataUrl = await resizeImage(file);
      stashImage(dataUrl, value.trim());
      router.push(editHref(value.trim() || "like this photo", { img: "1" }));
    } catch (err) {
      setImgError(err instanceof Error ? err.message : "Couldn't use that image.");
    }
  };

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        onDragOver={(e) => {
          if (!FEATURES.imageSearch) return;
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          if (!FEATURES.imageSearch) return;
          e.preventDefault();
          setDragging(false);
          onImage(e.dataTransfer.files?.[0]);
        }}
        className={cn(
          "flex items-end gap-2 rounded-2xl border bg-paper p-2 shadow-sm transition focus-within:border-ink",
          dragging ? "border-accent ring-2 ring-accent/30" : "border-line",
        )}
      >
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          rows={compact ? 1 : 2}
          placeholder={dragging ? "Drop a photo to find similar pieces" : PLACEHOLDERS[ph]}
          aria-label="Describe what you're looking for"
          className={cn("min-h-0 flex-1 resize-none bg-transparent px-3 py-2 outline-none placeholder:text-ink-faint", compact ? "text-base" : "text-lg")}
        />
        {FEATURES.imageSearch && (
          <>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onImage(e.target.files?.[0])} />
            <button type="button" onClick={() => fileRef.current?.click()} className="rounded-full p-2.5 text-ink-soft hover:bg-sand hover:text-ink" aria-label="Search with a photo">
              <Camera size={19} />
            </button>
          </>
        )}
        <button type="submit" disabled={!value.trim()} className="rounded-full bg-ink p-2.5 text-canvas disabled:opacity-30" aria-label="Search">
          <ArrowUp size={19} />
        </button>
      </form>
      {imgError && <p className="mt-2 text-sm text-warn">{imgError}</p>}
    </div>
  );
}
