/** Display/LLM cleanup for catalog text: mojibake, HTML entities, SEO boilerplate (docs/catalog-notes.md). */

// Windows-1252 code points above 0x7F that aren't Latin-1, mapped back to their byte.
const CP1252: Record<string, number> = {
  "€": 0x80, "‚": 0x82, "ƒ": 0x83, "„": 0x84, "…": 0x85, "†": 0x86, "‡": 0x87, "ˆ": 0x88, "‰": 0x89,
  "Š": 0x8a, "‹": 0x8b, "Œ": 0x8c, "Ž": 0x8e, "‘": 0x91, "’": 0x92, "“": 0x93, "”": 0x94, "•": 0x95,
  "–": 0x96, "—": 0x97, "˜": 0x98, "™": 0x99, "š": 0x9a, "›": 0x9b, "œ": 0x9c, "ž": 0x9e, "Ÿ": 0x9f,
};

const MOJIBAKE = /[ÃÂâ][\u0080-ÿ€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ]/;

/** Reverses UTF-8 text that was decoded as Windows-1252 (possibly twice). Leaves clean text alone. */
export function fixMojibake(input: string): string {
  let s = input;
  for (let round = 0; round < 2 && MOJIBAKE.test(s); round++) {
    const bytes: number[] = [];
    let ok = true;
    for (const ch of s) {
      const code = ch.codePointAt(0)!;
      if (code <= 0xff) bytes.push(code);
      else if (CP1252[ch] !== undefined) bytes.push(CP1252[ch]);
      else {
        ok = false;
        break;
      }
    }
    if (!ok) break;
    const decoded = Buffer.from(bytes).toString("utf8");
    if (decoded.includes("�")) break;
    s = decoded;
  }
  // Leftover fragments of broken quotes/dashes that couldn't be decoded.
  return s.replace(/â€[\u0080-ÿ€œ™˜"]*|Ã¢â‚¬[^\s]*/g, "").replace(/[\u0080-\u009f]/g, "");
}

const ENTITIES: Record<string, string> = { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " ", "#39": "'" };

export function decodeEntities(s: string): string {
  return s.replace(/&(#x?[0-9a-f]+|[a-z0-9]+);/gi, (m, e: string) => {
    const lower = e.toLowerCase();
    if (lower in ENTITIES) return ENTITIES[lower];
    if (lower.startsWith("#x")) return String.fromCodePoint(parseInt(lower.slice(2), 16));
    if (lower.startsWith("#")) return String.fromCodePoint(parseInt(lower.slice(1), 10));
    return m;
  });
}

const squash = (s: string) => s.replace(/\s+/g, " ").trim();
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

/** Removes "Buy …", "@ 3299", "| Shop for Brand", "| Brand India", "– Brand" from titles. */
export function cleanTitle(raw: string, brand?: string): string {
  let s = squash(decodeEntities(fixMojibake(raw)));
  s = s.replace(/^(buy|shop|find)\s+/i, "");
  s = s.replace(/\s*@\s*(₹|rs\.?|inr)?\s*[\d,]+(\.\d+)?\b/gi, "");
  // Split on separators and keep the descriptive head.
  const parts = s.split(/\s+[|–—]\s+|\s+-\s+(?=[A-Z])/);
  if (parts.length > 1) {
    const b = brand ? norm(brand) : "";
    const kept = parts.filter((p, i) => {
      if (i === 0) return true;
      const n = norm(p);
      if (!n) return false;
      if (/^(shop|buy)\b/i.test(p) || /\bindia$/i.test(p)) return false;
      if (b && (n.includes(b) || b.includes(n))) return false;
      return p.length > 3 && !/^(online|free shipping)/i.test(p);
    });
    s = kept.slice(0, 2).join(" · ");
  }
  s = s.replace(/^(buy|shop|find)\s+/i, "");
  return squash(s) || squash(raw);
}

export function cleanText(raw: string | undefined | null): string {
  return raw ? squash(decodeEntities(fixMojibake(raw))) : "";
}

export function domainOf(url: string | undefined | null): string {
  if (!url) return "";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}
