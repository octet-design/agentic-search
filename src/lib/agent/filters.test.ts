import { describe, expect, it } from "vitest";
import { andFilters, baseFilter, escapeFilterValue, inFilter, notInFilter, priceFilter } from "./filters";

describe("escapeFilterValue", () => {
  it("wraps values in backticks", () => {
    expect(escapeFilterValue("Navy Blue")).toBe("`Navy Blue`");
  });

  it("keeps commas and brackets inside the quotes", () => {
    expect(escapeFilterValue("black, white [set]")).toBe("`black, white [set]`");
  });

  it("escapes backticks (real raw fabric value)", () => {
    expect(escapeFilterValue("30`s dbl jersey jacquard 100%")).toBe("`30\\`s dbl jersey jacquard 100%`");
  });
});

describe("in/notIn filters", () => {
  it("builds lists", () => {
    expect(inFilter("color", ["Navy Blue", "Off White"])).toBe("color:=[`Navy Blue`,`Off White`]");
    expect(notInFilter("fabric", ["polyester"])).toBe("fabric:!=[`polyester`]");
  });

  it("returns null for empty lists", () => {
    expect(inFilter("color", [])).toBeNull();
    expect(notInFilter("color", [])).toBeNull();
  });
});

describe("priceFilter", () => {
  it("handles closed and open ranges", () => {
    expect(priceFilter(1000, 2000)).toBe("price:[1000..2000]");
    expect(priceFilter(null, 2000)).toBe("price:<=2000");
    expect(priceFilter(1500, null)).toBe("price:>=1500");
    expect(priceFilter(null, null)).toBeNull();
  });

  it("swaps inverted bounds and rounds outward", () => {
    expect(priceFilter(3000, 2000)).toBe("price:[2000..3000]");
    expect(priceFilter(999.5, 1999.2)).toBe("price:[999..2000]");
  });
});

describe("andFilters / baseFilter", () => {
  it("drops empty parts", () => {
    expect(andFilters("a:1", null, undefined, false, "", "b:2")).toBe("a:1 && b:2");
  });

  it("builds the M0 base filter", () => {
    expect(baseFilter({ excludedGenders: ["other", "unidentified"], excludedCategoryValues: ["other", "fragrances"] })).toBe(
      "in_stock:true && is_active:!=false && gender:!=[`other`,`unidentified`] && category:!=[`other`,`fragrances`] && price:>=50",
    );
  });
});
