/** Small hand-written taxonomy shared by unit tests. */
import { createTaxonomy } from "./taxonomy";
import type { Family, Taxonomy } from "./taxonomy.schema";
import { emptyIntent, type Intent } from "./types";

export const fam = (id: string, rawValues: string[], extra: Partial<Family> = {}): Family => ({
  id,
  label: id[0].toUpperCase() + id.slice(1),
  rawValues,
  alsoRawValues: [],
  related: [],
  keywords: [],
  count: rawValues.length * 10,
  ...extra,
});

export const fixtureData: Taxonomy = {
  version: 1,
  generatedAt: "2026-09-24T00:00:00.000Z",
  model: "test",
  minCount: 5,
  genderMap: { female: "women", male: "men", girl: "girls", boy: "boys", infant: "kids", unisex: "unisex", other: null },
  categories: [
    { id: "saree", label: "Saree", department: "ethnic-wear", parent: null, rawValues: ["silk sarees"], genders: ["women"], count: 100 },
    { id: "kurta-set", label: "Kurta set", department: "ethnic-wear", parent: null, rawValues: ["kurta sets"], genders: ["women", "men"], count: 50 },
    { id: "kurta-palazzo-set", label: "Kurta palazzo set", department: "ethnic-wear", parent: "kurta-set", rawValues: ["kurta-palazzo sets"], genders: ["women"], count: 80 },
    { id: "dress", label: "Dress", department: "dresses-jumpsuits", parent: null, rawValues: ["dresses"], genders: ["women", "girls"], count: 40 },
    { id: "bodycon-dress", label: "Bodycon dress", department: "dresses-jumpsuits", parent: "dress", rawValues: ["bodycon dresses"], genders: ["women"], count: 20 },
  ],
  excludedCategoryValues: ["other"],
  colorFamilies: [
    fam("black", ["black"], { related: ["navy"], keywords: ["black"] }),
    fam("navy", ["navy blue"], { related: ["blue", "black"], keywords: ["navy"] }),
    fam("blue", ["blue"], { related: ["navy"], keywords: ["blue"] }),
    fam("red", ["red"], { alsoRawValues: ["white and red"], keywords: ["red", "crimson"] }),
    fam("white", ["white", "white and red"], { keywords: ["white"] }),
  ],
  fabricFamilies: [
    fam("cotton", ["cotton", "100% cotton"], { related: ["linen"], keywords: ["cotton"] }),
    fam("linen", ["linen"], { keywords: ["linen"] }),
    fam("silk", ["silk"], { related: ["satin", "crepe"], keywords: ["silk"] }),
    fam("satin", ["satin"], { keywords: ["satin"] }),
    fam("crepe", ["crepe"], { keywords: ["crepe"] }),
    fam("polyester", ["polyester", "100% polyester"], { alsoRawValues: ["poly cotton"], keywords: ["polyester"] }),
  ],
  patternFamilies: [fam("floral", ["floral"], { keywords: ["floral"] }), fam("solid", ["solid"])],
  fitFamilies: [fam("slim", ["slim"]), fam("regular", ["regular"])],
  useCases: [fam("office", ["office wear"]), fam("party", ["party"])],
  brands: [fam("jack-and-jones", ["Jackjones"], { label: "Jack & Jones" })],
  priceStats: { women: { all: { count: 1000, p25: 1350, median: 2975, p75: 8950 } } },
};

export const fixtureTax = createTaxonomy(fixtureData);

export function intentWith(patch: Partial<Intent>): Intent {
  return { ...emptyIntent("test query"), ...patch };
}
