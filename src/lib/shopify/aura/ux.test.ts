import { describe, expect, it } from "vitest";
import { getCountry } from "../countries";
import { reduce, type AuraChat } from "./store";
import { budgetPresets, composeFilterMessage, loaderProgress, placeInColumns, tileShape } from "./ux";

describe("loaderProgress", () => {
  it("climbs with time, never finishes on its own, and jumps to 100 with results", () => {
    expect(loaderProgress(0, 0)).toBe(0);
    expect(loaderProgress(1000, 0)).toBeGreaterThan(15);
    expect(loaderProgress(60_000, 2)).toBe(92);
    expect(loaderProgress(100, 2)).toBe(45);
    expect(loaderProgress(100, 3)).toBe(100);
  });
});

describe("composeFilterMessage", () => {
  it("joins picks in order without repeats", () => {
    expect(
      composeFilterMessage([
        { question: "Budget", picked: ["Under ₹3,000"] },
        { question: "Length", picked: ["Ankle length", ""] },
        { question: "Fit", picked: ["Loose waist", "Ankle length"] },
      ]),
    ).toBe("Under ₹3,000, Ankle length, Loose waist");
  });
});

describe("budgetPresets", () => {
  it("uses steps that fit the currency", () => {
    expect(budgetPresets("INR")[0]).toBe(1000);
    expect(budgetPresets(getCountry("US").currency)[0]).toBe(50);
  });
});

describe("aura reducer", () => {
  const chat: AuraChat = { id: "c", title: "", country: "IN", createdAt: 0, updatedAt: 0, messages: [{ id: "m", role: "assistant", status: "streaming", activity: null, blocks: [], followups: [] }], shown: [], nextRef: 1, chips: [], hidden: [], refinements: [], activeSection: null, pinned: [] };
  const card = { id: "p1", title: "Shirt", image: null, price: { amount: 100000, currency: "INR" }, priceFrom: false, seller: "S", sellerId: null, rating: null, features: [], url: null, checkoutUrl: null, defaultOptions: null, ref: 1 };

  it("shows the newest result set and records refs and refinements", () => {
    let c = reduce(chat, "m", { type: "section", id: "s1", title: "T", why: "", search: { query: "shirt", min: null, max: null, local: false }, products: [card], hasMore: true });
    c = reduce(c, "m", { type: "refinements", items: [{ question: "Fit?", options: ["Slim", "Relaxed"] }] });
    expect(c.activeSection).toBe("s1");
    expect(c.shown).toEqual([{ ref: 1, id: "p1", title: "Shirt", store: "S", price: "₹1,000" }]);
    expect(c.nextRef).toBe(2);
    expect(c.refinements[0].options).toEqual(["Slim", "Relaxed"]);
  });
});

describe("masonry", () => {
  it("gives each id the same shape every time", () => {
    expect(tileShape("abc")).toEqual(tileShape("abc"));
  });

  it("fills the shortest column and never moves placed items when more are appended", () => {
    const ratio = (n: number) => (n % 2 ? 1.5 : 1);
    const first = placeInColumns([1, 2, 3, 4, 5], 3, ratio);
    const more = placeInColumns([1, 2, 3, 4, 5, 6, 7, 8], 3, ratio);
    first.forEach((col, i) => expect(more[i].slice(0, col.length)).toEqual(col));
    expect(first.map((c) => c.length)).toEqual([2, 2, 1]);
  });
});
