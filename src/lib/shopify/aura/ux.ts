/** Pure helpers for Aura's UI (unit-tested). */

/**
 * Loader percentage: an eased clock (never reaches 100 on its own) lifted by real progress from the stream.
 * `stage`: 0 started, 1 the agent is thinking, 2 searching the catalog, 3 results arrived.
 */
export function loaderProgress(elapsedMs: number, stage: 0 | 1 | 2 | 3): number {
  if (stage >= 3) return 100;
  const clock = 92 * (1 - Math.exp(-elapsedMs / 3500));
  const floor = [0, 15, 45][stage];
  return Math.min(99, Math.round(Math.max(clock, floor)));
}

/** Masonry tile shapes (height / width) with their Tailwind aspect class. */
const SHAPES = [
  { cls: "aspect-[3/4]", ratio: 4 / 3 },
  { cls: "aspect-[4/5]", ratio: 5 / 4 },
  { cls: "aspect-[2/3]", ratio: 3 / 2 },
  { cls: "aspect-[3/4]", ratio: 4 / 3 },
  { cls: "aspect-square", ratio: 1 },
];

/**
 * A stable shape per product (Shopify gives no image dimensions): picked from the id, so a tile's height is known
 * before its image loads and never changes on re-render.
 */
export function tileShape(id: string): (typeof SHAPES)[number] {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return SHAPES[h % SHAPES.length];
}

/**
 * Masonry placement: each item goes to the currently shortest column. Deterministic over the list, so appending
 * items never moves the ones already placed. `extra` is the text area under each image, in widths.
 */
export function placeInColumns<T>(items: T[], columns: number, ratioOf: (t: T) => number, extra = 0.32): T[][] {
  const cols: T[][] = Array.from({ length: Math.max(1, columns) }, () => []);
  const heights = cols.map(() => 0);
  for (const it of items) {
    const i = heights.indexOf(Math.min(...heights));
    cols[i].push(it);
    heights[i] += ratioOf(it) + extra;
  }
  return cols;
}
