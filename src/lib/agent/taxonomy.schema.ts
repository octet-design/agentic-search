import { z } from "zod";

/** Audience values that raw `gender` facet values map to. `null` = excluded from search. */
export const AUDIENCES = ["women", "men", "girls", "boys", "kids", "unisex"] as const;
export type Audience = (typeof AUDIENCES)[number];

/**
 * Gender-neutral departments. Combined with the audience filter they give the brief's
 * "women-ethnic" / "men-footwear" style departments (relaxation step 5 broadens to these).
 */
export const DEPARTMENTS = [
  { id: "ethnic-wear", label: "Ethnic wear" },
  { id: "western-tops", label: "Tops & shirts" },
  { id: "western-bottoms", label: "Bottoms" },
  { id: "dresses-jumpsuits", label: "Dresses & jumpsuits" },
  { id: "co-ord-sets", label: "Co-ords & sets" },
  { id: "outerwear", label: "Jackets, sweaters & outerwear" },
  { id: "activewear", label: "Activewear" },
  { id: "innerwear-sleepwear", label: "Innerwear, sleep & lounge" },
  { id: "swimwear", label: "Swim & beachwear" },
  { id: "baby-wear", label: "Baby wear" },
  { id: "footwear", label: "Footwear" },
  { id: "bags", label: "Bags" },
  { id: "jewellery", label: "Jewellery" },
  { id: "accessories", label: "Accessories" },
  { id: "non-fashion", label: "Non-fashion (excluded)" },
] as const;
export const DEPARTMENT_IDS = DEPARTMENTS.map((d) => d.id) as [DepartmentId, ...DepartmentId[]];
export type DepartmentId = (typeof DEPARTMENTS)[number]["id"];

const Id = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "ids are kebab-case");

export const CategorySchema = z.object({
  id: Id,
  label: z.string().min(1),
  department: z.enum(DEPARTMENT_IDS),
  /** Broader category that includes this one (maxi-dress → dress). Chains allowed, never cycles. */
  parent: Id.nullable(),
  rawValues: z.array(z.string()),
  /** Audiences with at least a few in-catalog products of this category. */
  genders: z.array(z.enum(AUDIENCES)),
  count: z.number().int().nonnegative(),
});
export type Category = z.infer<typeof CategorySchema>;

/** A canonical concept for color/fabric/pattern/fit/use_case/brand. */
export const FamilySchema = z.object({
  id: Id,
  label: z.string().min(1),
  /** Raw values whose primary meaning is this family. Used for include filters. */
  rawValues: z.array(z.string()),
  /** Raw values that partly contain this family ("red and white" for white). Added for exclude filters only. */
  alsoRawValues: z.array(z.string()),
  /** Neighbouring colours / sibling fabrics etc., used by the relaxation ladder. */
  related: z.array(Id),
  /** Lowercase substrings that indicate this family in unseen raw values or free text. */
  keywords: z.array(z.string()),
  count: z.number().int().nonnegative(),
});
export type Family = z.infer<typeof FamilySchema>;

export const PriceBandSchema = z.object({
  count: z.number().int().nonnegative(),
  p25: z.number(),
  median: z.number(),
  p75: z.number(),
});
export type PriceBand = z.infer<typeof PriceBandSchema>;

export const TaxonomySchema = z.object({
  version: z.literal(1),
  generatedAt: z.string(),
  model: z.string(),
  minCount: z.number().int(),
  genderMap: z.record(z.string(), z.enum(AUDIENCES).nullable()),
  categories: z.array(CategorySchema),
  /** Raw category values that are never shown (non-fashion). Part of the base filter. */
  excludedCategoryValues: z.array(z.string()),
  colorFamilies: z.array(FamilySchema),
  fabricFamilies: z.array(FamilySchema),
  patternFamilies: z.array(FamilySchema),
  fitFamilies: z.array(FamilySchema),
  useCases: z.array(FamilySchema),
  brands: z.array(FamilySchema),
  /** audience → ("all" | department id) → price band (in stock, base filter applied). */
  priceStats: z.record(z.string(), z.record(z.string(), PriceBandSchema)),
});
export type Taxonomy = z.infer<typeof TaxonomySchema>;

export const FACET_FIELDS = ["category", "color", "fabric", "pattern", "fit", "useCase", "brand"] as const;
export type FacetField = (typeof FACET_FIELDS)[number];

/** Typesense field name for each taxonomy field. */
export const TYPESENSE_FIELD: Record<FacetField, string> = {
  category: "category",
  color: "color",
  fabric: "fabric",
  pattern: "pattern",
  fit: "fit",
  useCase: "use_case",
  brand: "brand",
};
