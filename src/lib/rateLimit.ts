/** Basic in-memory per-IP rate limit for LLM routes (brief §11). */
const g = globalThis as unknown as { __drapeRate?: Map<string, number[]> };
g.__drapeRate ??= new Map();

export function rateLimited(req: Request, limit = 30, windowMs = 60_000): boolean {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
  const now = Date.now();
  const hits = (g.__drapeRate!.get(ip) ?? []).filter((t) => now - t < windowMs);
  hits.push(now);
  g.__drapeRate!.set(ip, hits);
  return hits.length > limit;
}

export function tooMany(): Response {
  return Response.json({ message: "Too many requests. Please wait a minute and try again.", retryable: true }, { status: 429 });
}
