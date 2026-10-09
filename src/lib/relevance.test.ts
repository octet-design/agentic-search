import { describe, expect, it } from "vitest";
import { fixtureTax as tax } from "./agent/testFixture";
import type { ProductCard } from "./agent/types";
import { CATALOG_NUDGE, dropOffMeaning, fromStore, hasTerm, isExact, isTheItemItself, mixByRelevance, namesCategory, orderByRelevance, sortByPrice } from "./relevance";

const card = (id: string, title: string, extra: Partial<ProductCard> = {}): ProductCard => ({
  id,
  title,
  brand: "B",
  category: "",
  gender: "female",
  color: "",
  fabric: null,
  fit: null,
  pattern: null,
  useCase: [],
  price: 1000,
  sizes: [],
  image: null,
  url: "",
  domain: "",
  reason: "",
  matched: [],
  score: 0,
  ...extra,
});

describe("isExact", () => {
  const chaniya = { terms: ["chaniya choli", "chaniyacholi"], categoryLevel: false };

  it("accepts the named item in any spelling, from either source", () => {
    expect(isExact(card("1", "Pink Silk Sangeet Wear Sequins Work Chaniya Choli"), chaniya, [], tax)).toBe(true);
    expect(isExact(card("2", "Red Kalamkari Cotton Chaniya-Choli With Dupatta", { source: "shopify" }), chaniya, [], tax)).toBe(true);
    expect(isExact(card("3", "Tiered ChaniyaCholi Set"), chaniya, [], tax)).toBe(true);
    expect(isExact(card("4", "Navratri set", { source: "shopify", extraText: "Mirror-work chaniya choli with dupatta" }), chaniya, [], tax)).toBe(true);
  });

  it("rejects close-but-different items", () => {
    expect(isExact(card("5", "Maroon Embroidered Lehenga Choli Set"), chaniya, [], tax)).toBe(false);
    expect(isExact(card("6", "Black Gamthi Work Navratri Lehenga"), chaniya, [], tax)).toBe(false);
  });

  it("accepts catalog items in the category only for a whole-category anchor", () => {
    const sareeItem = card("7", "Banarasi weave six yards", { category: "silk sarees" });
    expect(isExact(sareeItem, { terms: ["saree"], categoryLevel: true }, ["saree"], tax)).toBe(true);
    expect(isExact(sareeItem, { terms: ["kanjivaram saree"], categoryLevel: false }, ["saree"], tax)).toBe(false);
    // Shopify cards have no category: they need the word.
    expect(isExact(card("8", "Banarasi weave six yards", { source: "shopify" }), { terms: ["saree"], categoryLevel: true }, ["saree"], tax)).toBe(false);
  });

  it("matches child categories of a whole-category anchor", () => {
    const set = card("9", "Floral three piece", { category: "kurta-palazzo sets" });
    expect(isExact(set, { terms: ["kurta set"], categoryLevel: true }, ["kurta-set"], tax)).toBe(true);
  });
});

describe("orderByRelevance", () => {
  const items = [card("s1", "a", { source: "shopify" }), card("c1", "b", { source: "typesense" }), card("s2", "c", { source: "shopify" }), card("c2", "d")];

  it("orders by score, catalog first among near-equal scores", () => {
    const score = new Map([
      ["s1", 0.811],
      ["c1", 0.805],
      ["s2", 0.9],
      ["c2", 0.5],
    ]);
    expect(orderByRelevance(items, score).map((x) => x.id)).toEqual(["s2", "c1", "s1", "c2"]);
  });

  it("lets a clearly better Shopify match lead", () => {
    const score = new Map([
      ["s1", 0.86],
      ["c1", 0.8],
    ]);
    expect(orderByRelevance(items.slice(0, 2), score).map((x) => x.id)).toEqual(["s1", "c1"]);
  });
});

describe("mixByRelevance", () => {
  const c1 = card("c1", "a", { brand: "X" });
  const c2 = card("c2", "b", { brand: "Y" });
  const s1 = card("s1", "c", { source: "shopify", brand: "Z" });
  const s2 = card("s2", "d", { source: "shopify", brand: "W" });
  it("puts a clearly better Shopify product ahead of ours", () => {
    const score = new Map([["s1", 0.8], ["c1", 0.6], ["c2", 0.5], ["s2", 0.4]]);
    expect(mixByRelevance([c1, c2], [s1, s2], score, 10).map((x) => x.id)).toEqual(["s1", "c1", "c2", "s2"]);
  });
  it("lets our catalog win a near-tie", () => {
    const score = new Map([["s1", 0.62], ["c1", 0.6]]);
    expect(0.62 - 0.6).toBeLessThan(CATALOG_NUDGE);
    expect(mixByRelevance([c1], [s1], score, 10).map((x) => x.id)).toEqual(["c1", "s1"]);
  });
  it("counts Shopify's visual order on photo searches", () => {
    const score = new Map([["s1", 0.5], ["s2", 0.5], ["c1", 0.49]]);
    expect(mixByRelevance([c1], [s1, s2], score, 10, { visual: true }).map((x) => x.id)[0]).toBe("s1");
    expect(mixByRelevance([c1], [s1, s2], score, 10).map((x) => x.id)[0]).toBe("c1");
  });
});

describe("hasTerm", () => {
  it("matches words in any order, plurals and joined/split spellings", () => {
    expect(hasTerm("Men's White Virat Kohli Printed Oversized T-Shirt", "kohli t-shirt")).toBe(true);
    expect(hasTerm("Virat Kohli Oversized Tshirt", "t-shirt")).toBe(true);
    expect(hasTerm("Virat Kohli Oversized Tshirt", "tshirt")).toBe(true);
    expect(hasTerm("Classic T Shirt", "tshirt")).toBe(true);
    expect(hasTerm("Running Shoes for Men", "running shoe")).toBe(true);
  });
  it("needs whole words, not substrings", () => {
    expect(hasTerm("Sareesbazaar Cotton Kurta", "saree")).toBe(false);
    expect(hasTerm("Handbag in tan leather", "bag")).toBe(false);
  });
});

describe("isExact with mustInclude", () => {
  const kohliTee = { terms: ["t-shirt", "tshirt", "tee", "jersey"], categoryLevel: false, mustInclude: ["kohli"] };
  it("needs the item and every insisted-on name", () => {
    expect(isExact(card("k1", "King Kohli Unrivaled Graphic Oversized Tee", { source: "shopify" }), kohliTee, [], tax)).toBe(true);
    expect(isExact(card("k2", "Virat Kohli - Premium Off-White Oversized Tshirt", { source: "shopify" }), kohliTee, [], tax)).toBe(true);
    expect(isExact(card("k3", "MS Dhoni 7 Printed T-Shirt", { source: "shopify" }), kohliTee, [], tax)).toBe(false);
    expect(isExact(card("k4", "Virat Kohli Signature Cap", { source: "shopify" }), kohliTee, [], tax)).toBe(false);
  });
});

describe("sortByPrice", () => {
  const xs = [card("a", "a", { price: 900 }), card("b", "b", { price: 300 }), card("c", "c", { price: 300 }), card("d", "d", { price: 1200 })];
  it("sorts by price when asked, keeping relevance order for equal prices", () => {
    expect(sortByPrice(xs, "price_asc").map((x) => x.id)).toEqual(["b", "c", "a", "d"]);
    expect(sortByPrice(xs, "price_desc").map((x) => x.id)).toEqual(["d", "a", "b", "c"]);
    expect(sortByPrice(xs, "relevance").map((x) => x.id)).toEqual(["a", "b", "c", "d"]);
  });
});

describe("dropOffMeaning", () => {
  it("drops an item far below the best match, keeps the normal spread", () => {
    const xs = ["tee", "edifier", "jbl", "noise"].map((id) => ({ id }));
    const score = new Map([
      ["tee", 0.391],
      ["edifier", 0.765],
      ["jbl", 0.592],
      ["noise", 0.55],
    ]);
    expect(dropOffMeaning(xs, score).map((x) => x.id)).toEqual(["edifier", "jbl", "noise"]);
  });
});

describe("category-level anchors only accept the category they name", () => {
  it("lets a saree search accept sarees, but not a narrower item accept its parent category", () => {
    expect(namesCategory("saree", "saree", tax)).toBe(true);
    expect(namesCategory("kurta sets", "kurta-set", tax)).toBe(true);
    expect(namesCategory("silk saree blouse", "saree", tax)).toBe(false);
    const sareeItem = card("s1", "Banarasi weave six yards", { category: "silk sarees" });
    expect(isExact(sareeItem, { terms: ["saree blouse"], categoryLevel: true }, ["saree"], tax)).toBe(false);
    expect(isExact(sareeItem, { terms: ["saree"], categoryLevel: true }, ["saree"], tax)).toBe(true);
  });
});

describe("fromStore", () => {
  it("matches a store however it's spaced or cased, by brand or domain", () => {
    expect(fromStore({ brand: "Daily Objects" }, "DailyObjects")).toBe(true);
    expect(fromStore({ brand: "Shop", domain: "dailyobjects.com" }, "dailyobjects")).toBe(true);
    expect(fromStore({ brand: "watchtopia.in" }, "DailyObjects")).toBe(false);
    expect(fromStore({ brand: "Argos Watches" }, "")).toBe(false);
  });
});

describe("isTheItemItself (accessories)", () => {
  it("rejects the main item, keeps accessories for it", () => {
    expect(isTheItemItself({ title: "Leather Strap Analog Watch", source: "shopify" }, "watch", tax)).toBe(true);
    expect(isTheItemItself({ title: "Duke Analogue Men Black Watch with Leather Strap", source: "shopify" }, "watch", tax)).toBe(true);
    expect(isTheItemItself({ title: "Apple Watch Leather Strap (Vintage Brown)", source: "shopify" }, "watch", tax)).toBe(false);
    expect(isTheItemItself({ title: "Croc Leather Watch Strap (18mm)", source: "shopify" }, "watch", tax)).toBe(false);
    expect(isTheItemItself({ title: "Silk Saree with Blouse Piece", source: "shopify" }, "saree", tax)).toBe(true);
    expect(isTheItemItself({ title: "Embroidered Silk Blouse for Sarees", source: "shopify" }, "saree", tax)).toBe(false);
    expect(isTheItemItself({ title: "Banarasi weave six yards", category: "silk sarees" }, "saree", tax)).toBe(true);
  });
  it("is part of the exact check", () => {
    const strap = { terms: ["leather strap", "watch strap"], categoryLevel: false, forItem: "watch" };
    expect(isExact(card("w1", "Leather Strap Analog Watch"), strap, [], tax)).toBe(false);
    expect(isExact(card("w2", "Croc Leather Watch Strap (18mm)", { source: "shopify" }), strap, [], tax)).toBe(true);
    expect(isExact(card("w3", "Brown Leather Strap Clogs"), strap, [], tax)).toBe(false);
  });
});
