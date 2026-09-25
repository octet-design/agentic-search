import { describe, expect, it } from "vitest";
import { deriveChips, removeChip } from "./chips";
import { cleanTitle, fixMojibake } from "./cleanText";
import { applyTaste, TastePayloadSchema } from "./personalize";
import { makeChecker, phraseRegex } from "./postFilter";
import { buildQ, buildQuery } from "./queryBuilder";
import { relaxNote, relaxSteps } from "./relax";
import { applyRerank } from "./rerank";
import { diversify } from "./retrieve";
import { fixtureTax as tax, intentWith } from "./testFixture";
import type { RawProduct } from "./types";

const product = (p: Partial<RawProduct>): RawProduct => ({
  id: "1",
  title: "Plain Kurta Set",
  brand: "B",
  category: "kurta sets",
  gender: "female",
  color: "black",
  price: 1500,
  in_stock: true,
  product_url: "https://b.in/p/1",
  image_url: "https://b.in/i.jpg",
  ...p,
});

describe("queryBuilder", () => {
  it("builds hybrid params with base, audience and must filters", () => {
    const i = intentWith({
      audience: { segment: "women", kidGender: null, ageYears: null, source: "explicit" },
      categories: { include: ["kurta-set"], exclude: [], strength: "must" },
      colors: { include: ["black"], exclude: [], strength: "must" },
      price: { min: null, max: 2000, strength: "must" },
    });
    const { params, filter } = buildQuery(i, tax, { perPage: 80, facets: true });
    expect(params.query_by).toBe("title,embedding");
    expect(params.vector_query).toMatch(/^embedding:\(\[\], k: 250, alpha: [\d.]+\)$/);
    expect(params.exclude_fields).toBe("embedding");
    expect(params.facet_by).toContain("color");
    expect(filter).toContain("in_stock:true");
    expect(filter).toContain("gender:!=[`other`]");
    expect(filter).toContain("category:!=[`other`]");
    expect(filter).toContain("gender:=[`female`,`unisex`]");
    expect(filter).toContain("category:=[`kurta sets`,`kurta-palazzo sets`]");
    expect(filter).toContain("color:=[`black`]");
    expect(filter).toContain("price:<=2000");
  });

  it("always applies excludes (using partial values), even for prefer constraints", () => {
    const i = intentWith({
      colors: { include: ["navy"], exclude: ["red"], strength: "prefer" },
      fabrics: { include: [], exclude: ["polyester"], strength: "prefer" },
    });
    const { filter, q } = buildQuery(i, tax, { perPage: 40 });
    expect(filter).toContain("color:!=[`red`,`white and red`]");
    expect(filter).toContain("fabric:!=[`polyester`,`100% polyester`,`poly cotton`]");
    expect(filter).not.toContain("color:=[");
    expect(q).toContain("navy");
  });

  it("expands kids by gender and handles open price ranges and sort", () => {
    const i = intentWith({
      audience: { segment: "kids", kidGender: "girl", ageYears: 6, source: "explicit" },
      price: { min: 1500, max: null, strength: "must" },
      sort: "price_asc",
    });
    const { params, filter } = buildQuery(i, tax, { perPage: 40 });
    expect(filter).toContain("gender:=[`girl`]");
    expect(filter).toContain("price:>=1500");
    expect(params.sort_by).toBe("price:asc");
  });

  it("escapes values and skips unknown ids and empty constraints", () => {
    const i = intentWith({ categories: { include: ["nope"], exclude: [], strength: "must" } });
    const { filter, params } = buildQuery(i, tax, { perPage: 40 });
    expect(filter).not.toContain("category:=[");
    expect(params.facet_by).toBeUndefined();
    expect(params.sort_by).toBeUndefined();
  });

  it("appends only new prefer words to q", () => {
    expect(buildQ("black cotton kurta", ["black", "office"])).toBe("black cotton kurta office");
    expect(buildQ("", [])).toBe("*");
  });
});

describe("relaxation ladder", () => {
  const i = intentWith({
    categories: { include: ["kurta-palazzo-set"], exclude: [], strength: "must" },
    colors: { include: ["navy"], exclude: ["black"], strength: "must" },
    fabrics: { include: ["silk"], exclude: [], strength: "must" },
    patterns: { include: ["floral"], exclude: [], strength: "must" },
    fits: { include: ["slim"], exclude: [], strength: "must" },
    price: { min: null, max: 3000, strength: "must" },
    textExclusions: ["slit"],
    audience: { segment: "women", kidGender: null, ageYears: null, source: "explicit" },
  });

  it("follows the brief's order", () => {
    expect(relaxSteps(i, tax).map((s) => s.id)).toEqual([
      "pattern-prefer",
      "fit-prefer",
      "color-widen",
      "fabric-widen",
      "price-20",
      "price-40",
      "fabric-prefer",
      "category-parent",
      "category-department",
    ]);
  });

  it("never relaxes audience or exclusions, and never widens into an excluded colour", () => {
    let cur = i;
    for (const s of relaxSteps(i, tax)) cur = s.apply(cur);
    expect(cur.audience).toEqual(i.audience);
    expect(cur.colors.exclude).toEqual(["black"]);
    expect(cur.colors.include).not.toContain("black");
    expect(cur.textExclusions).toEqual(["slit"]);
    expect(cur.price?.max).toBe(4200);
    expect(cur.fabrics.include).toEqual(["silk", "satin", "crepe"]);
  });

  it("writes a human note", () => {
    const steps = relaxSteps(i, tax);
    const note = relaxNote([steps[3], steps[4], steps[5]]);
    expect(note).toBe("Few exact matches, so also showing similar fabrics (satin, crepe) and a few up to ₹4,200.");
  });
});

describe("post-filter", () => {
  it("matches phrases with hyphens, spaces and plurals", () => {
    const re = phraseRegex("cutouts")!;
    expect(re.test("Cut-out detail dress")).toBe(true);
    expect(re.test("Cut Out waist")).toBe(true);
    expect(re.test("Cutoutless")).toBe(false);
    expect(phraseRegex("no slit")!.test("Side slits kurta")).toBe(true);
    expect(phraseRegex("heavy embroidery")!.test("Heavily embroidered lehenga")).toBe(true);
  });

  it("drops facet, title and text violations, and missing must-keywords", () => {
    const i = intentWith({
      colors: { include: [], exclude: ["red"], strength: "prefer" },
      fabrics: { include: [], exclude: ["polyester"], strength: "prefer" },
      textExclusions: ["cutouts"],
      mustKeywords: ["chikankari"],
    });
    const c = makeChecker(i, tax);
    expect(c.violations(product({ title: "Chikankari kurta", color: "white and red" }))).toEqual(["color:red"]);
    expect(c.violations(product({ title: "Chikankari kurta", fabric: "Poly Cotton" }))).toEqual([]);
    expect(c.violations(product({ title: "Chikankari kurta", fabric: "poly cotton" }))).toEqual(["fabric:polyester"]);
    expect(c.violations(product({ title: "Crimson chikankari kurta" }))).toEqual(["title:color:red"]);
    expect(c.violations(product({ title: "Chikankari dress with cut-outs" }))).toEqual(["text:cutouts"]);
    expect(c.violations(product({ title: "Plain kurta" }))).toEqual(["missing:chikankari"]);
    expect(c.violations(product({ title: "Chikankari polyester-free kurta", fabric: "Polyester Georgette" }))).toContain("fabric:polyester");
  });
});

describe("chips", () => {
  const i = intentWith({
    audience: { segment: "women", kidGender: null, ageYears: null, source: "implied" },
    categories: { include: ["kurta-set"], exclude: [], strength: "must" },
    colors: { include: ["black"], exclude: [], strength: "must" },
    fabrics: { include: [], exclude: ["polyester"], strength: "prefer" },
    price: { min: null, max: 2000, strength: "must" },
    softPreferences: ["elegant"],
  });

  it("derives chips from the intent", () => {
    expect(deriveChips(i, tax).map((c) => c.label)).toEqual(["Women", "Kurta set", "Black", "✕ Polyester", "Under ₹2,000", "~ elegant"]);
  });

  it("removes a chip's constraint", () => {
    expect(removeChip(i, "fabrics:exclude:polyester").fabrics.exclude).toEqual([]);
    expect(removeChip(i, "price").price).toBeNull();
    expect(removeChip(i, "softPreferences:elegant").softPreferences).toEqual([]);
    expect(removeChip(i, "audience").audience.segment).toBe("unknown");
  });
});

describe("cleanText", () => {
  it("fixes mojibake and strips SEO boilerplate", () => {
    expect(fixMojibake("Blue and White Maxi Dress â€“ Brand")).toBe("Blue and White Maxi Dress – Brand");
    expect(fixMojibake("Plain title")).toBe("Plain title");
    expect(fixMojibake("CafÃ© Dress")).toBe("Café Dress");
    expect(cleanTitle("Buy Black Geometric Printed Cotton kurta Set @ 3299 | Shop for Aurelia", "Aurelia")).toBe(
      "Black Geometric Printed Cotton kurta Set",
    );
    expect(cleanTitle("Classic Elite White Sneakers for Men | Hummel India", "Hummel")).toBe("Classic Elite White Sneakers for Men");
    expect(cleanTitle("Serendipity Coral &amp; Aqua Set")).toBe("Serendipity Coral & Aqua Set");
  });
});

describe("diversity", () => {
  it("caps items per brand in the top n and keeps the rest after", () => {
    const items = ["a", "a", "a", "a", "b", "a", "c"].map((brand, i) => ({ brand, i }));
    const out = diversify(items, 5, 3);
    expect(out.slice(0, 5).map((x) => x.brand)).toEqual(["a", "a", "a", "b", "c"]);
    expect(out.map((x) => x.i)).toEqual([0, 1, 2, 4, 6, 3, 5]);
  });
});

describe("personalize", () => {
  const taste = TastePayloadSchema.parse({ audiences: ["women"], budget: { min: 1000, max: 3000 }, avoidColors: ["neon"] });

  it("fills a missing audience and budget from the profile, as soft preferences", () => {
    const { intent, notes } = applyTaste(intentWith({ needsClarification: { question: "Who?", options: ["Women", "Men"] } }), taste, tax);
    expect(intent.audience).toMatchObject({ segment: "women", source: "profile" });
    expect(intent.needsClarification).toBeNull();
    expect(intent.price).toEqual({ min: 1000, max: 3000, strength: "prefer" });
    expect(intent.softPreferences).toContain("avoid neon");
    expect(notes).toEqual(["Assumed Women from your profile", "Preferring ₹1k–₹3k", "Avoiding neon"]);
  });

  it("never overrides explicit words", () => {
    const explicit = intentWith({
      audience: { segment: "men", kidGender: null, ageYears: null, source: "explicit" },
      price: { min: null, max: 5000, strength: "must" },
    });
    const { intent } = applyTaste(explicit, taste, tax);
    expect(intent.audience.segment).toBe("men");
    expect(intent.price).toEqual({ min: null, max: 5000, strength: "must" });
  });
});

describe("applyRerank", () => {
  const card = (id: string) => ({ id, title: id, brand: "b", category: "c", gender: "female", color: "black", fabric: null, fit: null, pattern: null, useCase: [], price: 1000, sizes: [], image: "x", url: "u", domain: "d", reason: "fallback", matched: [], score: 0 });

  it("drops text-exclusion violations and low scores, halves other claimed violations, orders by score", () => {
    const items = [
      { id: "a", score: 0.9, reason: "A", matched: [], violates: [] },
      { id: "b", score: 0.95, reason: "B", matched: [], violates: ["has cutouts at the waist"] },
      { id: "c", score: 0.9, reason: "C", matched: [], violates: ["over budget"] },
      { id: "d", score: 0.2, reason: "D", matched: [], violates: [] },
    ];
    const { kept, dropped } = applyRerank(["a", "b", "c", "d", "e"].map(card), items, ["cutouts"]);
    expect(kept.map((p) => p.id)).toEqual(["a", "e", "c"]);
    expect(kept.find((p) => p.id === "c")!.score).toBe(0.45);
    expect(kept.find((p) => p.id === "e")!.reason).toBe("fallback");
    expect(dropped.map((d) => d.id)).toEqual(["b", "d"]);
  });
});

describe("taste tie-breaks", () => {
  const card = (id: string, color: string, score: number) => ({ id, color, fabric: "cotton", brand: "b", category: "c", score });

  it("reorders near-ties toward liked colours but never overrides a clearly better match", async () => {
    const { tasteBoost, TastePayloadSchema: S } = await import("./personalize");
    const taste = S.parse({ likes: { colors: ["navy blue"] }, avoidColors: ["red"] });
    const out = tasteBoost([card("a", "black", 0.8), card("b", "navy blue", 0.78), card("c", "red", 0.79), card("d", "navy blue", 0.5)], taste, tax);
    expect(out.map((p) => p.id)).toEqual(["b", "a", "c", "d"]);
  });

  it("is a no-op without taste", async () => {
    const { tasteBoost } = await import("./personalize");
    const items = [card("a", "black", 0.8), card("b", "navy blue", 0.78)];
    expect(tasteBoost(items, undefined, tax)).toBe(items);
  });
});

describe("taste derivation", () => {
  it("weights likes/clicks/dislikes and builds a compact summary", async () => {
    const { deriveTaste, serializeTaste } = await import("../taste");
    const lite = (id: string, color: string, fabric: string, brand: string, price: number) => ({ id, color, fabric, brand, category: "kurtas", pattern: "solid", fit: "regular", price });
    const t = deriveTaste({
      profile: { audiences: ["women"], sizes: {}, budget: null, styles: [], avoidColors: ["neon"], avoidFabrics: [], onlyMySize: false },
      signals: {
        liked: [lite("1", "pastel pink", "cotton", "Fabindia", 1200), lite("2", "pastel pink", "cotton", "W", 2800), lite("3", "ivory", "cotton", "Fabindia", 2000)],
        clicked: [],
        disliked: [
          { p: lite("4", "red", "polyester", "X", 900), reason: "fabric" },
          { p: lite("5", "black", "rayon", "X", 900), reason: "style" },
        ],
      },
    });
    expect(t.colors[0]).toBe("pastel pink");
    expect(t.brands[0]).toBe("fabindia");
    expect(t.avoidColors).toEqual(["neon"]);
    expect(t.avoidFabrics).toEqual(["polyester"]);
    expect(t.avoidBrands).toEqual(["x"]);
    expect(t.priceBand).toEqual({ min: 1200, max: 2000 });
    const s = serializeTaste(t);
    expect(s).toContain("likes: brands[fabindia, w]");
    expect(s).toContain("avoids: colors[neon], fabrics[polyester], brands[x]");
    expect(s.length / 4).toBeLessThan(400);
  });
});

describe("kids-title guard", () => {
  it("drops kids' items from adult audiences even when the catalog tags them female/male", async () => {
    const { makeChecker: mk, KIDS_TITLE } = await import("./postFilter");
    const women = intentWith({ audience: { segment: "women", kidGender: null, ageYears: null, source: "explicit" } });
    const c = mk(women, tax);
    expect(c.violations(product({ title: "Cotton Linen Blend Striped Shirt (0-5 Yrs)" }))).toContain("audience:kids-title");
    expect(c.violations(product({ title: "Rare Ones Kids Light Purple Cotton Jacket" }))).toContain("audience:kids-title");
    expect(c.violations(product({ title: "Women's Striped Cotton Shirt" }))).toEqual([]);
    expect(KIDS_TITLE.test("Girls Party Dress")).toBe(true);
    expect(KIDS_TITLE.test("Kurta set with 3/4 sleeves")).toBe(false);
    const kids = mk(intentWith({ audience: { segment: "kids", kidGender: "girl", ageYears: 6, source: "explicit" } }), tax);
    expect(kids.violations(product({ title: "Girls Party Dress (5-6 Yrs)", gender: "girl" }))).toEqual([]);
  });
});
