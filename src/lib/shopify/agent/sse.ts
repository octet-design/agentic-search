import type { Emit, FindsEvent } from "./types";

/** Streams a turn as Server-Sent Events; stops the work when the browser goes away. */
export function findsStream(run: (emit: Emit, signal: AbortSignal) => Promise<void>, reqSignal: AbortSignal): Response {
  const encoder = new TextEncoder();
  const ac = new AbortController();
  reqSignal.addEventListener("abort", () => ac.abort());

  const stream = new ReadableStream<Uint8Array>({
    async start(c) {
      let closed = false;
      const send = (chunk: string) => {
        if (closed) return;
        try {
          c.enqueue(encoder.encode(chunk));
        } catch {
          closed = true;
        }
      };
      const emit = (e: FindsEvent) => send(`data: ${JSON.stringify(e)}\n\n`);
      // Keep proxies from closing the stream while the model thinks.
      const ping = setInterval(() => send(": ping\n\n"), 10_000);
      try {
        await run(emit, ac.signal);
      } catch (err) {
        if (!ac.signal.aborted) {
          console.error("[finds] turn failed:", err);
          emit({ type: "error", message: friendly(err), retryable: true });
        }
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
      ac.abort();
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

/** Never leak keys, hosts or stack traces to the browser. */
function friendly(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (/timeout|timed out|ETIMEDOUT|aborted/i.test(msg)) return "That took too long. Please try again.";
  if (/rate limit|429/i.test(msg)) return "Lots of requests right now. Please try again in a moment.";
  return "Something went wrong. Please try again.";
}
