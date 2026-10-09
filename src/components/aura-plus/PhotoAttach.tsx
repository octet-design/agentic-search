"use client";

import { ImagePlus, X } from "lucide-react";
import { useRef, useState } from "react";
import { resizeImage } from "@/lib/image";

/** A photo ready to send: `full` for the agent (≤ 768px JPEG), `thumb` kept on the chat message. */
export type Photo = { full: string; thumb: string };

const ACCEPT = "image/jpeg,image/png,image/webp";

/** Scout: attach a photo to the message. A photo is never sent on its own: the message text is still required. */
export function AttachButton({ onPick, className = "" }: { onPick: (p: Photo) => void; className?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => input.current?.click()}
        aria-label="Add a photo"
        title={error ?? "Add a photo"}
        className={`shrink-0 rounded-full p-2 text-ink-soft hover:bg-sand hover:text-ink ${className}`}
      >
        <ImagePlus size={20} />
      </button>
      <input
        ref={input}
        type="file"
        accept={ACCEPT}
        hidden
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          if (!ACCEPT.split(",").includes(file.type)) return setError("Use a JPEG, PNG or WebP photo.");
          try {
            const [full, thumb] = await Promise.all([resizeImage(file, 768, 0.82), resizeImage(file, 160, 0.7)]);
            setError(null);
            onPick({ full, thumb });
          } catch {
            setError("Couldn't read that photo.");
          }
        }}
      />
    </>
  );
}

/** The attached photo, with a way to remove it and a reminder that it needs words. */
export function PhotoPreview({ photo, onRemove, needsText }: { photo: Photo; onRemove: () => void; needsText: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className="relative shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo.thumb} alt="Attached photo" className="h-14 w-14 rounded-lg object-cover" />
        <button type="button" onClick={onRemove} aria-label="Remove photo" className="absolute -right-1.5 -top-1.5 rounded-full bg-ink p-0.5 text-canvas">
          <X size={12} />
        </button>
      </span>
      <span className={`text-sm ${needsText ? "text-accent" : "text-ink-soft"}`}>
        {needsText ? "Add a few words with your photo, e.g. “find this in blue” or “shoes to go with this”." : "Photo attached."}
      </span>
    </div>
  );
}
