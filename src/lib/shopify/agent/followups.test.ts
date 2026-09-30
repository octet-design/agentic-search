import { describe, expect, it } from "vitest";
import { createAnswerSplitter } from "./followups";
import { isNonFashionQuery } from "../search";

function run(chunks: string[]) {
  const s = createAnswerSplitter();
  let shown = chunks.map((c) => s.push(c)).join("");
  const { rest, followups } = s.end();
  shown += rest;
  return { shown, followups };
}

describe("createAnswerSplitter", () => {
  it("streams the answer and strips the follow-up line", () => {
    const out = run(["Here are ", "two picks.\n- [A](#1) — great", "\n>> cheaper | in bl", "ack | what goes with it"]);
    expect(out.shown).toBe("Here are two picks.\n- [A](#1) — great");
    expect(out.followups).toEqual(["cheaper", "in black", "what goes with it"]);
  });

  it("never leaks a marker split across chunks", () => {
    const s = createAnswerSplitter();
    expect(s.push("Done.\n")).toBe("Done.");
    expect(s.push(">")).toBe("");
    expect(s.push("> more")).toBe("");
    expect(s.end()).toEqual({ rest: "", followups: ["more"] });
  });

  it("keeps plain newlines and '>' that are not the marker", () => {
    const out = run(["a > b\n", "\nnext para"]);
    expect(out.shown).toBe("a > b\n\nnext para");
    expect(out.followups).toEqual([]);
  });

  it("accepts one suggestion per line", () => {
    expect(run(["Hi\n>> one\n>> two"]).followups).toEqual(["one", "two"]);
  });
});

describe("isNonFashionQuery", () => {
  it("blocks gadgets, home and beauty but not fashion", () => {
    for (const q of ["wireless headphones", "coffee mug", "face serum", "gaming laptop", "smartphone"]) expect(isNonFashionQuery(q), q).toBe(true);
    for (const q of ["linen shirt men", "cotton kurta women", "leather watch men", "tote bag", "sneakers", "phone crossbody bag", "tea dress", "coffee brown sweater", "d cup bra", "pet print shirt"]) expect(isNonFashionQuery(q), q).toBe(false);
  });
});
