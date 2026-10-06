import { describe, expect, it } from "vitest";
import { fixtureTax as tax } from "./agent/testFixture";
import type { ProductCard } from "./agent/types";
import { isExact, orderByRelevance } from "./relevance";

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
