import { describe, expect, it } from "vitest";
import { shortId, toCard } from "./client";
import { money, shopifyProductHref, similarQuery, toMinor } from "./format";
import { SearchResult } from "./types";

// Trimmed from a real search_catalog response.
const RAW = {
  ucp: { version: "2026-08-25" },
  products: [
    {
      id: "gid://shopify/p/CWrOpP2iY6oDNcdbWOGXA",
      title: "The Casa Blanca - Short Sleeve White Linen Shirt",
      description: { plain: "A breathable white linen shirt." },
      rating: { value: 4.9, scale_min: 1, scale_max: 5, count: 526 },
      media: [{ type: "image", url: "https://cdn.shopify.com/a.jpg", alt_text: "shirt" }],
      variants: [
        {
          id: "gid://shopify/ProductVariant/1",
          price: { amount: 960000, currency: "INR" },
          availability: { available: true },
          options: [{ name: "Size", label: "S" }],
          seller: { name: "Kenny Flowers", url: "https://www.kennyflowers.com" },
          checkout_url: "https://www.kennyflowers.com/cart/1:1",
        },
      ],
      price_range: { min: { amount: 960000, currency: "INR" }, max: { amount: 990000, currency: "INR" } },
    },
  ],
  messages: [],
  pagination: { has_next_page: true, total_count: 316, cursor: "abc" },
};

describe("shopify catalog", () => {
  it("parses a search response into slim cards", () => {
    const parsed = SearchResult.parse(RAW);
    expect(toCard(parsed.products[0])).toEqual({
      id: "CWrOpP2iY6oDNcdbWOGXA",
      title: "The Casa Blanca - Short Sleeve White Linen Shirt",
      image: "https://cdn.shopify.com/a.jpg",
      price: { amount: 960000, currency: "INR" },
      priceFrom: true,
      seller: "Kenny Flowers",
      sellerId: null,
      rating: { value: 4.9, count: 526 },
      features: [],
      url: null,
      checkoutUrl: "https://www.kennyflowers.com/cart/1:1",
      defaultOptions: "S",
    });
    expect(parsed.pagination?.cursor).toBe("abc");
  });

  it("formats minor-unit prices per currency", () => {
    expect(money({ amount: 960000, currency: "INR" })).toBe("₹9,600");
    expect(money({ amount: 2599, currency: "USD" }, "en-US")).toBe("$25.99");
    expect(money({ amount: 1500, currency: "JPY" }, "en-US")).toBe("¥1,500");
  });

  it("round-trips product ids and option picks in the URL", () => {
    expect(shortId("gid://shopify/p/abc123")).toBe("abc123");
    expect(shopifyProductHref("abc123", [{ name: "Size", label: "M" }])).toBe("/shopify/p/abc123?Size=M");
    expect(shopifyProductHref("abc123", [{ name: "Size", label: "M" }], "GB")).toBe("/shopify/p/abc123?Size=M&country=GB");
  });

  it("converts whole prices to minor units per currency", () => {
    expect(toMinor(3000, "INR")).toBe(300000);
    expect(toMinor(1500, "JPY")).toBe(1500);
  });

  it("builds a look-alike query from a product title", () => {
    expect(similarQuery("Women's Mul Shiffon Kurti - R1138")).toBe("women's mul shiffon kurti");
    expect(similarQuery("The Casa Blanca - Short Sleeve White Linen Shirt")).toBe("the casa blanca short sleeve");
  });
});
