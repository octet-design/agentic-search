"use client";

/** Resizes an image file to ≤ 768px JPEG and returns a base64 data URL (brief §9.5). */
export async function resizeImage(file: File, max = 768, quality = 0.82): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("Couldn't read that image."));
      i.src = url;
    });
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", quality);
  } finally {
    URL.revokeObjectURL(url);
  }
}

const KEY = "drape.pendingImage";

export function stashImage(dataUrl: string, text: string) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ dataUrl, text }));
  } catch {
    // storage full or blocked: image search will show an error
  }
}

export function takeImage(): { dataUrl: string; text: string } | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as { dataUrl: string; text: string }) : null;
  } catch {
    return null;
  }
}
