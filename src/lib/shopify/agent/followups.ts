/**
 * The model ends its answer with a line like `>> cheaper options | in black | what goes with it`.
 * This streams the visible text and keeps that line (even half-streamed) out of it.
 */
export function createAnswerSplitter() {
  let full = "";
  let sent = 0;
  const markerAt = () => {
    const m = /(^|\n)[ \t]*>>/.exec(full);
    return m ? m.index : -1;
  };

  return {
    /** Adds a streamed chunk; returns the text that is now safe to show. */
    push(delta: string): string {
      full += delta;
      const at = markerAt();
      let end = at >= 0 ? at : full.length;
      // Hold back a possible marker start until the next chunk says what it is.
      if (at < 0) {
        const tail = /(^|\n)[ \t]*>?$/.exec(full);
        if (tail) end = tail.index;
      }
      if (end <= sent) return "";
      const out = full.slice(sent, end);
      sent = end;
      return out;
    },
    /** Call once the answer is complete: the unsent visible text and the parsed follow-ups. */
    end(): { rest: string; followups: string[] } {
      const at = markerAt();
      const end = at >= 0 ? at : full.length;
      const rest = end > sent ? full.slice(sent, end).trimEnd() : "";
      sent = Math.max(sent, end);
      const followups =
        at < 0
          ? []
          : full
              .slice(at)
              .split(/\n|\|/)
              .map((s) => s.replace(/^[\s>]+/, "").replace(/^["'“]|["'”]$/g, "").trim())
              .filter((s) => s.length > 0 && s.length <= 60)
              .slice(0, 4);
      return { rest, followups };
    },
  };
}
