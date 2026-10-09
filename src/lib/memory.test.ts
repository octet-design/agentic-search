import { describe, expect, it } from "vitest";
import { mergeFacts, personKey, recipientKey, tidyFact, undoFacts, type MemoryPerson } from "./memory";

let n = 0;
const id = () => `f${++n}`;

describe("personKey", () => {
  it("normalises relations in English and Hinglish", () => {
    expect(personKey("Mummy")).toEqual({ key: "mom", label: "Mom" });
    expect(personKey("my mother")).toEqual({ key: "mom", label: "Mom" });
    expect(personKey("papa")).toEqual({ key: "dad", label: "Dad" });
    expect(personKey("my younger sister")).toEqual({ key: "sister", label: "Sister" });
    expect(personKey("grandmother")).toEqual({ key: "grandma", label: "Grandma" });
    expect(personKey("me")).toEqual({ key: "self", label: "You" });
    expect(personKey("Riya")).toEqual({ key: "name:riya", label: "Riya" });
  });
});

describe("mergeFacts", () => {
  it("files facts under the right person and skips repeats", () => {
    const { people, saved } = mergeFacts(
      [],
      [
        { person: "self", kind: "size", text: "Wears size M tops" },
        { person: "mom", kind: "likes", text: "Loves cotton sarees" },
        { person: "Mummy", kind: "likes", text: "loves cotton sarees" },
      ],
      1,
      id,
    );
    expect(people.map((p) => [p.key, p.facts.map((f) => f.text)])).toEqual([
      ["self", ["Wears size M tops"]],
      ["mom", ["Loves cotton sarees"]],
    ]);
    expect(saved.map((s) => s.label)).toEqual(["You", "Mom"]);
  });

  it("replaces an outdated fact", () => {
    const start: MemoryPerson[] = [{ key: "self", label: "You", facts: [{ id: "a", kind: "size", text: "Wears size M tops", at: 1 }] }];
    const { people } = mergeFacts(start, [{ person: "me", kind: "size", text: "Wears size L tops", replaces: "wears size m tops" }], 2, id);
    expect(people[0].facts.map((f) => f.text)).toEqual(["Wears size L tops"]);
  });

  it("undo removes exactly what was saved", () => {
    const { people, saved } = mergeFacts([], [{ person: "dad", kind: "avoid", text: "Doesn't like bright colours" }], 1, id);
    expect(undoFacts(people, saved)).toEqual([]);
  });
});

describe("recipientKey", () => {
  it("finds who a request is for", () => {
    expect(recipientKey("gift for my dad's 60th")).toBe(null); // possessive: an occasion, not the wearer
    expect(recipientKey("a kurta for my dad")).toBe("dad");
    expect(recipientKey("saree for my mom for diwali")).toBe("mom");
    expect(recipientKey("papa ke liye shirt")).toBe("dad");
    expect(recipientKey("something for my 6 year old daughter")).toBe("daughter");
    expect(recipientKey("kurta for office")).toBe(null);
    expect(recipientKey("my mom wears size L and loves cotton sarees")).toBe("mom");
    expect(recipientKey("my younger sister loves pastels")).toBe("sister");
    expect(recipientKey("my mom's birthday is next week, I need a dress")).toBe(null);
    expect(recipientKey("my size is M")).toBe(null);
    expect(recipientKey("a dress for riya", [{ key: "name:riya", label: "Riya" }])).toBe("name:riya");
  });
});

describe("tidyFact", () => {
  it("turns terse notes into sentences and leaves sentences alone", () => {
    expect(tidyFact("size", "L")).toBe("Wears size L");
    expect(tidyFact("likes", "cotton sarees")).toBe("Likes cotton sarees");
    expect(tidyFact("avoid", "polyester")).toBe("Avoids polyester");
    expect(tidyFact("budget", "under ₹3,000")).toBe("Usually spends under ₹3,000");
    expect(tidyFact("size", "Wears size M tops")).toBe("Wears size M tops");
    expect(tidyFact("likes", "loves pastel colours.")).toBe("Loves pastel colours");
  });
});
