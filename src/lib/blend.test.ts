import { describe, expect, it } from "vitest";
import { blend, fromShopify, isShopifyId, shopifyIdOf } from "./blend";

describe("blend", () => {
  it("interleaves two catalog items per Shopify item, then the rest", () => {
    const c = ["c1", "c2", "c3", "c4", "c5"].map((id) => ({ id }));
    const s = ["s1", "s2", "s3", "s4"].map((id) => ({ id }));
    expect(blend(c, s).map((x) => x.id)).toEqual(["c1", "c2", "s1", "c3", "c4", "s2", "c5", "s3", "s4"]);
    expect(blend([], s).map((x) => x.id)).toEqual(["s1", "s2", "s3", "s4"]);
  });

  it("turns a Shopify card into a tagged catalog card in rupees", () => {
    const p = fromShopify({
      id: "AbC123",
      title: "Linen shirt",
      image: "https://cdn.shopify.com/x.jpg",
      price: { amount: 249900, currency: "INR" },
      priceFrom: false,
      seller: "Kenny Flowers",
      sellerId: null,
      rating: null,
      features: [],
      url: "https://www.kennyflowers.com/products/x",
      checkoutUrl: "https://www.kennyflowers.com/cart/1:1",
      defaultOptions: null,
    });
    expect(p).toMatchObject({ id: "shopify-AbC123", brand: "Kenny Flowers", price: 2499, source: "shopify", domain: "kennyflowers.com" });
    expect(isShopifyId(p.id)).toBe(true);
    expect(shopifyIdOf(p.id)).toBe("AbC123");
  });
});
