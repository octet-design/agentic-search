import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createTaxonomy, getTaxonomy } from "./taxonomy";
import type { Family, Taxonomy } from "./taxonomy.schema";

const fam = (id: string, rawValues: string[], extra: Partial<Family> = {}): Family => ({
  id,
  label: id,
  rawValues,
  alsoRawValues: [],
  related: [],
  keywords: [],
  count: rawValues.length * 10,
  ...extra,
});

const fixture: Taxonomy = {
  version: 1,
  generatedAt: "2026-09-24T00:00:00.000Z",
  model: "test",
  minCount: 5,
  genderMap: { female: "women", male: "men", girl: "girls", boy: "boys", infant: "kids", unisex: "unisex", other: null },
  categories: [
    { id: "saree", label: "Saree", department: "ethnic-wear", parent: null, rawValues: ["silk sarees", "printed sarees"], genders: ["women"], count: 100 },
    { id: "kurta-set", label: "Kurta set", department: "ethnic-wear", parent: null, rawValues: ["kurta sets"], genders: ["women", "men"], count: 50 },
    { id: "kurta-palazzo-set", label: "Kurta palazzo set", department: "ethnic-wear", parent: "kurta-set", rawValues: ["kurta-palazzo sets"], genders: ["women"], count: 80 },
    { id: "sneakers", label: "Sneakers", department: "footwear", parent: null, rawValues: ["sneakers"], genders: ["men", "women"], count: 40 },
    { id: "jewellery", label: "Jewellery", department: "jewellery", parent: null, rawValues: ["fashion jewellery"], genders: ["women"], count: 90 },
    { id: "earring", label: "Earring", department: "jewellery", parent: "jewellery", rawValues: ["earrings"], genders: ["women"], count: 20 },
    { id: "jhumka", label: "Jhumka", department: "jewellery", parent: "earring", rawValues: ["jhumkas"], genders: ["women"], count: 30 },
  ],
  excludedCategoryValues: ["other", "fragrances"],
  colorFamilies: [
    fam("navy", ["navy blue", "navy"], { related: ["blue", "ghost"], keywords: ["navy"] }),
    fam("blue", ["blue"], { related: ["navy"], keywords: ["blue"] }),
    fam("red", ["red"], { alsoRawValues: ["white and red"], keywords: ["red"] }),
    fam("white", ["white", "white and red"], { keywords: ["white"] }),
    fam("off-white", ["off white"], { keywords: ["off white", "ivory"] }),
  ],
  fabricFamilies: [
    fam("cotton", ["cotton", "100% cotton"], { keywords: ["cotton"] }),
    fam("cotton-blend", ["cotton blend"], { keywords: ["cotton blend"] }),
    fam("polyester", ["polyester"], { alsoRawValues: ["poly cotton"], keywords: ["polyester"] }),
  ],
  patternFamilies: [fam("floral", ["floral", "floral print"])],
  fitFamilies: [fam("slim", ["slim", "slim fit"])],
  useCases: [fam("office", ["office wear", "work"])],
  brands: [fam("jack-and-jones", ["Jackjones"], { label: "Jack & Jones" })],
  priceStats: {
    women: { all: { count: 1000, p25: 1350, median: 2975, p75: 8950 }, "ethnic-wear": { count: 500, p25: 2000, median: 4000, p75: 9000 } },
  },
};

const tax = createTaxonomy(fixture);

describe("expand", () => {
  it("returns primary raw values for includes", () => {
    expect(tax.expand("color", ["navy"])).toEqual(["navy blue", "navy"]);
    expect(tax.expand("color", ["red"])).toEqual(["red"]);
  });

  it("adds partial values for excludes", () => {
    expect(tax.expand("color", ["red"], "exclude")).toEqual(["red", "white and red"]);
    expect(tax.expand("fabric", ["polyester"], "exclude")).toEqual(["polyester", "poly cotton"]);
  });

  it("merges several ids without duplicates and ignores unknown ids", () => {
    expect(tax.expand("fabric", ["cotton", "cotton", "silk"]).sort()).toEqual(["100% cotton", "cotton"]);
  });

  it("expands categories and brands", () => {
    expect(tax.expand("category", ["saree"])).toEqual(["silk sarees", "printed sarees"]);
    expect(tax.expand("category", ["kurta-palazzo-set"])).toEqual(["kurta-palazzo sets"]);
    expect(tax.expand("brand", ["jack-and-jones"])).toEqual(["Jackjones"]);
  });
});

describe("classify", () => {
  it("uses the exact mapping first, primary before partial", () => {
    expect(tax.classify("color", "white and red")).toEqual(["white", "red"]);
  });

  it("falls back to keywords for unseen values, longest keyword first", () => {
    expect(tax.classify("color", "Ivory Gold")).toEqual(["off-white"]);
    expect(tax.classify("fabric", "Polyester Georgette")).toEqual(["polyester"]);
    expect(tax.classify("color", "Off White Cream")).toEqual(["off-white", "white"]);
  });

  it("includes children when expanding a parent category, and the parent when classifying a child", () => {
    expect(tax.expand("category", ["kurta-set"])).toEqual(["kurta sets", "kurta-palazzo sets"]);
    expect(tax.children("kurta-set")).toEqual(["kurta-palazzo-set"]);
    expect(tax.classify("category", "kurta-palazzo sets")).toEqual(["kurta-palazzo-set", "kurta-set"]);
  });

  it("expands every level below a category and classifies up every level", () => {
    expect(tax.expand("category", ["jewellery"])).toEqual(["fashion jewellery", "earrings", "jhumkas"]);
    expect(tax.expand("category", ["earring"])).toEqual(["earrings", "jhumkas"]);
    expect(tax.classify("category", "jhumkas")).toEqual(["jhumka", "earring", "jewellery"]);
  });

  it("returns nothing for empty or unknown values", () => {
    expect(tax.classify("color", null)).toEqual([]);
    expect(tax.classify("color", "zzz")).toEqual([]);
  });
});

describe("related and departments", () => {
  it("drops related ids that don't exist", () => {
    expect(tax.related("color", "navy")).toEqual(["blue"]);
  });

  it("uses same-department categories as related", () => {
    expect(tax.related("category", "saree")).toEqual(["kurta-set", "kurta-palazzo-set"]);
    expect(tax.department("sneakers")).toBe("footwear");
    expect(tax.categoriesInDepartment("ethnic-wear")).toEqual(["saree", "kurta-set", "kurta-palazzo-set"]);
  });
});

describe("audienceGenders", () => {
  it("adds unisex for adults", () => {
    expect(tax.audienceGenders({ segment: "women" }).sort()).toEqual(["female", "unisex"]);
    expect(tax.audienceGenders({ segment: "men" }).sort()).toEqual(["male", "unisex"]);
  });

  it("expands kids by gender and adds infant only for toddlers", () => {
    expect(tax.audienceGenders({ segment: "kids", kidGender: "girl", ageYears: 6 })).toEqual(["girl"]);
    expect(tax.audienceGenders({ segment: "kids", kidGender: "boy", ageYears: 2 }).sort()).toEqual(["boy", "infant"]);
    expect(tax.audienceGenders({ segment: "kids", kidGender: "any" }).sort()).toEqual(["boy", "girl", "infant"]);
  });

  it("applies no gender filter when unknown, and never includes excluded genders", () => {
    expect(tax.audienceGenders({ segment: "unknown" })).toEqual([]);
    expect(tax.audienceGenders({ segment: "unisex" })).not.toContain("other");
    expect(tax.excludedGenders()).toEqual(["other"]);
  });
});

describe("priceBand", () => {
  it("uses the department band and falls back to the audience band", () => {
    expect(tax.priceBand("women", "ethnic-wear")?.p25).toBe(2000);
    expect(tax.priceBand("women", "footwear")?.p25).toBe(1350);
    expect(tax.priceBand("aliens")).toBeNull();
  });
});

describe("promptVocabulary", () => {
  it("lists ids by department without raw values", () => {
    const v = tax.promptVocabulary();
    expect(v).toContain("ethnic-wear: saree, kurta-set[kurta-palazzo-set]");
    expect(v).toContain("jewellery: jewellery[earring[jhumka]]");
    expect(v).toContain("color: navy, blue, red, white, off-white");
    expect(v).toContain("brand: jack-and-jones");
    expect(v).not.toContain("silk sarees");
    expect(tax.promptVocabulary({ brands: false })).not.toContain("brand:");
  });
});

// Sanity checks on the generated file (skipped until `npm run build:taxonomy` has run).
const realFile = path.join(process.cwd(), "data", "taxonomy.json");
describe.skipIf(!existsSync(realFile))("data/taxonomy.json", () => {
  const real = existsSync(realFile) ? getTaxonomy() : null;

  it("maps every raw gender and excludes other/unidentified", () => {
    expect(Object.keys(real!.data.genderMap).sort()).toEqual(
      ["boy", "female", "girl", "infant", "male", "other", "unidentified", "unisex"],
    );
    expect(real!.excludedGenders().sort()).toEqual(["other", "unidentified"]);
  });

  it("has unique ids per field", () => {
    for (const field of ["category", "color", "fabric", "pattern", "fit", "useCase", "brand"] as const) {
      const ids = real!.families(field).map((f) => f.id);
      expect(new Set(ids).size, field).toBe(ids.length);
    }
  });

  it("never files a raw category under two categories, or under a category and the deny-list", () => {
    const seen = new Set<string>();
    for (const c of real!.data.categories) {
      for (const v of c.rawValues) {
        expect(seen.has(v), v).toBe(false);
        seen.add(v);
      }
    }
    for (const v of real!.data.excludedCategoryValues) expect(seen.has(v), v).toBe(false);
    expect(real!.data.excludedCategoryValues).toContain("other");
  });

  it("keeps category parents acyclic and within the same department", () => {
    const byId = new Map(real!.data.categories.map((c) => [c.id, c]));
    for (const c of real!.data.categories) {
      const seen = new Set([c.id]);
      let p = c.parent;
      while (p) {
        const parent = byId.get(p);
        expect(parent, `${c.id} → ${p}`).toBeDefined();
        expect(parent!.department).toBe(c.department);
        expect(seen.has(p), `cycle at ${c.id}`).toBe(false);
        seen.add(p);
        p = parent!.parent;
      }
    }
  });

  it("applies the parent overrides", () => {
    for (const id of ["jeans", "shorts", "legging", "wallet", "cufflink"]) {
      if (real!.has("category", id)) expect(real!.data.categories.find((c) => c.id === id)!.parent, id).toBeNull();
    }
  });

  it("groups generic asks over their variants", () => {
    expect(real!.expand("category", ["dress"])).toEqual(expect.arrayContaining(real!.expand("category", ["maxi-dress"])));
    expect(real!.expand("category", ["earring"])).toEqual(expect.arrayContaining(real!.expand("category", ["jhumka"])));
    expect(real!.expand("category", ["kurta-set"])).toEqual(expect.arrayContaining(["kurta-palazzo sets"]));
  });

  it("merges fibres that are the same material", () => {
    for (const id of ["spandex", "lycra", "viscose"]) expect(real!.has("fabric", id), id).toBe(false);
    expect(real!.classify("fabric", "fleece")).toContain("polyester");
  });

  it("covers the core concepts the brief relies on", () => {
    expect(real!.expand("color", ["navy"])).toContain("navy blue");
    expect(real!.expand("fabric", ["polyester"], "exclude")).toContain("100% polyester");
    expect(real!.related("color", "navy")).toContain("blue");
    expect(real!.priceBand("women")?.median).toBeGreaterThan(0);
  });

  it("keeps the prompt vocabulary compact (< ~3k tokens)", () => {
    expect(real!.promptVocabulary().length / 4).toBeLessThan(3000);
  });
});
