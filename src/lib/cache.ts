import { createHash } from "node:crypto";

/** Small in-memory LRU with TTL (brief §6.9). Map iteration order doubles as recency order. */
export class LRU<V> {
  private map = new Map<string, { v: V; exp: number }>();
  constructor(
    private max = 500,
    private ttlMs = 30 * 60_000,
  ) {}

  get(key: string): V | undefined {
    const e = this.map.get(key);
    if (!e) return undefined;
    if (e.exp < Date.now()) {
      this.map.delete(key);
      return undefined;
    }
    this.map.delete(key);
    this.map.set(key, e);
    return e.v;
  }

  set(key: string, v: V): void {
    this.map.delete(key);
    this.map.set(key, { v, exp: Date.now() + this.ttlMs });
    while (this.map.size > this.max) this.map.delete(this.map.keys().next().value!);
  }

  get size() {
    return this.map.size;
  }
}

export const hashKey = (...parts: unknown[]) =>
  createHash("sha1").update(JSON.stringify(parts)).digest("base64url").slice(0, 22);

// Survive Next.js dev hot reloads.
const g = globalThis as unknown as { __drapeCaches?: Record<string, LRU<unknown>> };
g.__drapeCaches ??= {};

export function namedCache<V>(name: string, max = 500, ttlMs = 30 * 60_000): LRU<V> {
  g.__drapeCaches![name] ??= new LRU<V>(max, ttlMs);
  return g.__drapeCaches![name] as LRU<V>;
}
