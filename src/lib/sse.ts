/** Server-Sent Events from route handlers (brief §2). */
import type { AgentEvent, Emit } from "./agent/types";

export function sseResponse(run: (emit: Emit, signal: AbortSignal) => Promise<void>, signal?: AbortSignal): Response {
  const encoder = new TextEncoder();
  const controller = new AbortController();
  signal?.addEventListener("abort", () => controller.abort());

  const stream = new ReadableStream<Uint8Array>({
    async start(c) {
      let closed = false;
      const emit: Emit = (e: AgentEvent) => {
        if (closed) return;
        try {
          c.enqueue(encoder.encode(`data: ${JSON.stringify(e)}\n\n`));
        } catch {
          closed = true;
        }
      };
      // Keep proxies from buffering/closing idle streams while the LLM thinks.
      const ping = setInterval(() => {
        if (!closed) c.enqueue(encoder.encode(": ping\n\n"));
      }, 10_000);
      try {
        await run(emit, controller.signal);
      } catch (err) {
        if (!controller.signal.aborted) emit({ type: "error", message: publicMessage(err), retryable: true });
      } finally {
        clearInterval(ping);
        closed = true;
        try {
          c.close();
        } catch {
          // already closed
        }
      }
    },
    cancel() {
      controller.abort();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

/** Never leak internals (keys, hosts, stack traces) to the browser. */
export function publicMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (/timeout|ECONNABORTED|ETIMEDOUT|aborted/i.test(msg)) return "The search took too long. Please try again.";
  if (/rate limit|429/i.test(msg)) return "We're getting a lot of requests. Please try again in a moment.";
  console.error("[drape] request failed:", msg);
  return "Something went wrong while searching. Please try again.";
}

export function jsonError(message: string, status = 400, retryable = false): Response {
  return Response.json({ message, retryable }, { status });
}
