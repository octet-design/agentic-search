import { readFileSync } from "node:fs";
import path from "node:path";
import {
  DEPARTMENTS,
  FACET_FIELDS,
  TaxonomySchema,
  type Audience,
  type Category,
  type DepartmentId,
  type FacetField,
  type Family,
  type PriceBand,
  type Taxonomy,
} from "./taxonomy.schema";

export type ExpandMode = "include" | "exclude";

export type AudienceQuery = {
  segment: "women" | "men" | "kids" | "unisex" | "unknown";
  kidGender?: "girl" | "boy" | "any" | null;
  ageYears?: number | null;
};

const INFANT_MAX_AGE = 2;

function categoryAsFamily(c: Category, siblings: string[]): Family {
  return { id: c.id, label: c.label, rawValues: c.rawValues, alsoRawValues: [], related: siblings, keywords: [], count: c.count };
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function createTaxonomy(data: Taxonomy) {
  const byDept = new Map<string, Category[]>();
  for (const c of data.categories) byDept.set(c.department, [...(byDept.get(c.department) ?? []), c]);

  const lists: Record<FacetField, Family[]> = {
    category: data.categories.map((c) =>
      categoryAsFamily(c, (byDept.get(c.department) ?? []).filter((s) => s.id !== c.id).map((s) => s.id)),
    ),
    color: data.colorFamilies,
    fabric: data.fabricFamilies,
    pattern: data.patternFamilies,
    fit: data.fitFamilies,
    useCase: data.useCases,
    brand: data.brands,
  };

  const index = {} as Record<
    FacetField,
    {
      byId: Map<string, Family>;
      primaryByRaw: Map<string, string[]>;
      alsoByRaw: Map<string, string[]>;
      keywords: { re: RegExp; id: string }[];
    }
  >;
  for (const field of FACET_FIELDS) {
    const byId = new Map<string, Family>();
    const primaryByRaw = new Map<string, string[]>();
    const alsoByRaw = new Map<string, string[]>();
    const keywords: { re: RegExp; id: string }[] = [];
    for (const f of lists[field]) {
      byId.set(f.id, f);
      for (const v of f.rawValues) primaryByRaw.set(v, [...(primaryByRaw.get(v) ?? []), f.id]);
      for (const v of f.alsoRawValues) alsoByRaw.set(v, [...(alsoByRaw.get(v) ?? []), f.id]);
      for (const k of f.keywords) {
        if (k.trim()) keywords.push({ re: new RegExp(`\\b${escapeRegExp(k.trim().toLowerCase())}`), id: f.id });
      }
    }
    // Longer keywords first, so "off white" wins over "white".
    keywords.sort((a, b) => b.re.source.length - a.re.source.length);
    index[field] = { byId, primaryByRaw, alsoByRaw, keywords };
  }

  const categoryById = new Map(data.categories.map((c) => [c.id, c]));
  const childrenOf = new Map<string, string[]>();
  for (const c of data.categories) {
    if (c.parent && categoryById.has(c.parent)) childrenOf.set(c.parent, [...(childrenOf.get(c.parent) ?? []), c.id]);
  }
  /** All categories below `id` (children, grandchildren…). */
  const descendants = (id: string, seen = new Set<string>()): string[] => {
    for (const k of childrenOf.get(id) ?? []) {
      if (seen.has(k)) continue;
      seen.add(k);
      descendants(k, seen);
    }
    return [...seen];
  };
  /** Parent, grandparent… of `id`, nearest first. */
  const ancestors = (id: string): string[] => {
    const out: string[] = [];
    let p = categoryById.get(id)?.parent;
    while (p && categoryById.has(p) && !out.includes(p) && p !== id) {
      out.push(p);
      p = categoryById.get(p)?.parent;
    }
    return out;
  };

  return {
    data,

    families(field: FacetField): readonly Family[] {
      return lists[field];
    },

    has(field: FacetField, id: string): boolean {
      return index[field].byId.has(id);
    },

    label(field: FacetField, id: string): string {
      return index[field].byId.get(id)?.label ?? id;
    },

    /**
     * Canonical ids → raw facet values. `include` uses only values whose primary meaning is the
     * family (precise); `exclude` also adds values that merely contain it (safe). A parent category
     * includes all its descendants (jewellery → earring → jhumka). Unknown ids are ignored.
     */
    expand(field: FacetField, ids: readonly string[], mode: ExpandMode = "include"): string[] {
      const out = new Set<string>();
      const all = field === "category" ? ids.flatMap((id) => [id, ...descendants(id)]) : ids;
      for (const id of all) {
        const f = index[field].byId.get(id);
        if (!f) continue;
        for (const v of f.rawValues) out.add(v);
        if (mode === "exclude") for (const v of f.alsoRawValues) out.add(v);
      }
      return [...out];
    },

    /**
     * Raw facet value → canonical ids (primary first). Falls back to keywords for values the
     * taxonomy never saw (count < minCount), so exclusions can still be checked on them.
     */
    classify(field: FacetField, raw: string | null | undefined): string[] {
      if (!raw) return [];
      const ix = index[field];
      const known = [...(ix.primaryByRaw.get(raw) ?? []), ...(ix.alsoByRaw.get(raw) ?? [])];
      if (field === "category") return [...new Set([...known, ...known.flatMap(ancestors)])];
      if (known.length) return [...new Set(known)];
      const lower = raw.toLowerCase();
      return [...new Set(ix.keywords.filter((k) => k.re.test(lower)).map((k) => k.id))];
    },

    /** Neighbouring families for relaxation (navy → blue, silk → satin; category → same department). */
    related(field: FacetField, id: string): string[] {
      return index[field].byId.get(id)?.related.filter((r) => index[field].byId.has(r)) ?? [];
    },

    /** Direct children of a category (empty for leaf categories). */
    children(categoryId: string): string[] {
      return childrenOf.get(categoryId) ?? [];
    },

    department(categoryId: string): DepartmentId | null {
      return categoryById.get(categoryId)?.department ?? null;
    },

    categoriesInDepartment(department: DepartmentId): string[] {
      return (byDept.get(department) ?? []).map((c) => c.id);
    },

    /** Raw `gender` values to filter on for an audience. Empty array = no gender filter needed. */
    audienceGenders(q: AudienceQuery): string[] {
      const rawFor = (...audiences: Audience[]) =>
        Object.entries(data.genderMap)
          .filter(([, a]) => a !== null && audiences.includes(a))
          .map(([raw]) => raw);
      switch (q.segment) {
        case "women":
          return rawFor("women", "unisex");
        case "men":
          return rawFor("men", "unisex");
        case "unisex":
          return rawFor("women", "men", "unisex");
        case "kids": {
          const baby = q.ageYears != null && q.ageYears <= INFANT_MAX_AGE ? (["kids"] as Audience[]) : [];
          if (q.kidGender === "girl") return rawFor("girls", ...baby);
          if (q.kidGender === "boy") return rawFor("boys", ...baby);
          return rawFor("girls", "boys", "kids");
        }
        case "unknown":
          return [];
      }
    },

    /** Raw gender values that are never searchable (mapped to null). */
    excludedGenders(): string[] {
      return Object.entries(data.genderMap)
        .filter(([, a]) => a === null)
        .map(([raw]) => raw);
    },

    excludedCategoryValues(): readonly string[] {
      return data.excludedCategoryValues;
    },

    /** In-stock price band for an audience, optionally for one department; falls back to the audience overall. */
    priceBand(audience: string, department?: DepartmentId | null): PriceBand | null {
      const byAudience = data.priceStats[audience];
      if (!byAudience) return null;
      return (department && byAudience[department]) || byAudience.all || null;
    },

    /**
     * Compact vocabulary for LLM prompts: ids only (they are readable kebab-case labels), no raw
     * values. Categories are grouped by department, children nested in brackets after their parent
     * (`jewellery[earring[jhumka, stud], ring]`); non-fashion is left out.
     */
    promptVocabulary(opts: { brands?: boolean } = {}): string {
      const lines: string[] = ["category (by department):"];
      for (const d of DEPARTMENTS) {
        if (d.id === "non-fashion") continue;
        const top = (byDept.get(d.id) ?? []).filter((c) => !c.parent || !categoryById.has(c.parent));
        const render = (id: string, depth: number): string => {
          const kids = depth < 8 ? childrenOf.get(id) : undefined;
          return kids?.length ? `${id}[${kids.map((k) => render(k, depth + 1)).join(", ")}]` : id;
        };
        const ids = top.map((c) => render(c.id, 0));
        if (ids.length) lines.push(`  ${d.id}: ${ids.join(", ")}`);
      }
      const row = (name: string, fams: Family[]) => lines.push(`${name}: ${fams.map((f) => f.id).join(", ")}`);
      row("color", data.colorFamilies);
      row("fabric", data.fabricFamilies);
      row("pattern", data.patternFamilies);
      row("fit", data.fitFamilies);
      row("useCase", data.useCases);
      if (opts.brands ?? true) row("brand", data.brands);
      return lines.join("\n");
    },
  };
}

export type TaxonomyApi = ReturnType<typeof createTaxonomy>;

let loaded: TaxonomyApi | null = null;

/** Loads and validates `data/taxonomy.json` once per process. */
export function getTaxonomy(): TaxonomyApi {
  if (loaded) return loaded;
  const file = path.join(process.cwd(), "data", "taxonomy.json");
  const parsed = TaxonomySchema.parse(JSON.parse(readFileSync(file, "utf8")));
  loaded = createTaxonomy(parsed);
  return loaded;
}
