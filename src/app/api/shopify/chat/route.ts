import { runFindsTurn } from "@/lib/shopify/agent/run";
import { findsStream } from "@/lib/shopify/agent/sse";
import { ChatRequestSchema } from "@/lib/shopify/agent/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Search + up to four model calls.
export const maxDuration = 60;

// Basic per-IP limit, kept separate from Drape's.
const g = globalThis as unknown as { __findsRate?: Map<string, number[]> };
g.__findsRate ??= new Map();
function limited(req: Request, limit = 20, windowMs = 60_000): boolean {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
  const now = Date.now();
  const hits = (g.__findsRate!.get(ip) ?? []).filter((t) => now - t < windowMs);
  hits.push(now);
  g.__findsRate!.set(ip, hits);
  return hits.length > limit;
}

/** POST one Genuine Finds chat turn; streams FindsEvents. */
export async function POST(req: Request) {
  if (limited(req)) return Response.json({ message: "Too many requests. Please wait a minute and try again." }, { status: 429 });
  const parsed = ChatRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ message: "Invalid request." }, { status: 400 });
  return findsStream((emit, signal) => runFindsTurn(parsed.data, emit, signal), req.signal);
}
