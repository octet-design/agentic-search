import { describe, expect, it } from "vitest";
import { getCountry } from "./countries";
import { curatedFor, interleave, seedSources, type FeedItem } from "./feed";

const item = (id: string): FeedItem => ({
  id,
  title: id,
  image: null,
  price: null,
  priceFrom: false,
  seller: null,
  sellerId: null,
  rating: null,
  features: [],
  url: null,
  checkoutUrl: null,
  defaultOptions: null,
  reason: null,
});

describe("feed", () => {
  it("interleaves sources round-robin, dropping repeats and excluded ids", () => {
    const out = interleave([[item("a"), item("b"), item("c")], [item("b"), item("x")], [item("y")]], new Set(["c"]));
    expect(out.map((i) => i.id)).toEqual(["a", "b", "y", "x"]);
  });

  it("turns behaviour into sources with a reason", () => {
    const src = seedSources({ products: [{ id: "p1", title: "Linen shirt" }], queries: ["western wear"], brands: [{ id: "gid://shopify/Shop/1", name: "Kenny Flowers" }] });
    expect(src.map((s) => s.key)).toEqual(["p:p1", "q:western wear", "b:gid://shopify/Shop/1"]);
    expect(src[0].spec.like).toBe("p1");
    expect(src[2].spec.shop).toBe("gid://shopify/Shop/1");
    expect(src[2].reason).toBe("More from Kenny Flowers");
  });

  it("mixes Indian ethnic wear into the cold-start feed only for India", () => {
    expect(curatedFor(getCountry("IN"))).toContain("chikankari kurta");
    expect(curatedFor(getCountry("US"))).not.toContain("chikankari kurta");
    expect(new Set(curatedFor(getCountry("IN"))).size).toBe(curatedFor(getCountry("IN")).length);
  });
});
