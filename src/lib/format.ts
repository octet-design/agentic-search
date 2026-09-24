import { APP_NAME } from "./config";

const inrFmt = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

/** ₹1,999 */
export const inr = (n: number) => `₹${inrFmt.format(Math.round(n))}`;

/** Outbound product link with UTM params (brief §9.3). */
export function outboundUrl(url: string): string {
  try {
    const u = new URL(url);
    u.searchParams.set("utm_source", APP_NAME.toLowerCase());
    u.searchParams.set("utm_medium", "poc");
    return u.toString();
  } catch {
    return url;
  }
}

/** /edits/<slug>: the URL-encoded, lower-cased query. */
export const editHref = (query: string, extra?: Record<string, string>) => {
  const qs = extra ? new URLSearchParams(extra).toString() : "";
  return `/edits/${encodeURIComponent(query.trim().toLowerCase())}${qs ? `?${qs}` : ""}`;
};

export function cn(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

/** base64url JSON for shareable refined states (?s=…). */
export function encodeState(obj: unknown): string {
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeState<T>(s: string | null | undefined): T | null {
  if (!s) return null;
  try {
    const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes)) as T;
  } catch {
    return null;
  }
}
