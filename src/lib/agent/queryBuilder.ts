/** Intent → Typesense search params (brief §6.3). Pure; unit-tested. */
import { andFilters, baseFilter, inFilter, notInFilter, priceFilter } from "./filters";
import type { TaxonomyApi } from "./taxonomy";
import { CONSTRAINT_FIELDS, TAXONOMY_FIELD, type Intent } from "./types";

export const DEFAULT_ALPHA = Number(process.env.DRAPE_ALPHA ?? 0.5);
export const FACET_FIELDS_MAIN = "color,fabric,pattern,fit,brand,use_case";

/**
 * Long value lists make Typesense slow (868 values ≈ 1.2 s). Raw values are stored most-common first,
 * so filters use the head; the post-filter re-checks every hit against the full taxonomy.
 */
export const MAX_INCLUDE_VALUES = 60;
export const MAX_EXCLUDE_VALUES = 120;

export type SearchParams = Record<string, string | number | boolean>;

export type BuildOptions = {
  perPage: number;
  facets?: boolean;
  alpha?: number;
  page?: number;
  /**
   * hybrid: title+embedding with every filter (the brief's shape).
   * exact: keyword-only on titles with every filter; drops query words until it has enough hits.
   * semantic: title+embedding with only base + audience filters (musts/excludes are checked in code).
   * Filtered vector search is pathologically slow on this server (docs/DECISIONS.md), so
   * retrieval runs exact + semantic and fuses them.
   */
  mode?: "hybrid" | "exact" | "semantic";
};

export type BuiltQuery = { params: SearchParams; filter: string; q: string };

export function buildQuery(intent: Intent, tax: TaxonomyApi, opts: BuildOptions): BuiltQuery {
  const mode = opts.mode ?? "hybrid";
  const parts: (string | null)[] = [
    baseFilter({ excludedGenders: tax.excludedGenders(), excludedCategoryValues: tax.excludedCategoryValues() }),
    inFilter(
      "gender",
      tax.audienceGenders({
        segment: intent.audience.segment,
        kidGender: intent.audience.kidGender,
        ageYears: intent.audience.ageYears,
      }),
    ),
  ];

  const light = mode === "semantic";
  const preferWords: string[] = [];
  for (const f of CONSTRAINT_FIELDS) {
    const c = intent[f];
    const tf = TAXONOMY_FIELD[f];
    const typesenseField = tf === "useCase" ? "use_case" : tf;
    if (c.include.length) {
      if (c.strength === "must" && !light) {
        const values = tax.expand(tf, c.include).slice(0, MAX_INCLUDE_VALUES);
        // An unknown id expands to nothing: skip rather than filter everything out.
        if (values.length) parts.push(inFilter(typesenseField, values));
      } else if (c.strength !== "must") {
        preferWords.push(...c.include.map((id) => tax.label(tf, id).split("/")[0].trim().toLowerCase()));
      }
    }
    // Exclusions always filter, whatever the strength.
    if (c.exclude.length && !light) parts.push(notInFilter(typesenseField, tax.expand(tf, c.exclude, "exclude").slice(0, MAX_EXCLUDE_VALUES)));
  }

  if (intent.price && intent.price.strength === "must" && !light) parts.push(priceFilter(intent.price.min, intent.price.max));
  if (intent.sizes && intent.sizes.strength === "must" && intent.sizes.values.length && !light) {
    parts.push(inFilter("sizes", intent.sizes.values));
  }

  const q = buildQ(intent.semanticQuery, preferWords);
  const params: SearchParams =
    mode === "exact"
      ? {
          q,
          query_by: "title",
          exclude_fields: "embedding",
          per_page: opts.perPage,
          page: opts.page ?? 1,
          filter_by: andFilters(...parts),
          // The filter already encodes the hard requirements: drop query words until the pool is full.
          drop_tokens_threshold: opts.perPage,
          typo_tokens_threshold: 1,
          prioritize_exact_match: false,
        }
      : {
          q,
          query_by: "title,embedding",
          vector_query: `embedding:([], k: 250, alpha: ${opts.alpha ?? DEFAULT_ALPHA})`,
          rerank_hybrid_matches: true,
          exclude_fields: "embedding",
          per_page: opts.perPage,
          page: opts.page ?? 1,
          filter_by: andFilters(...parts),
          drop_tokens_threshold: 10,
          prioritize_exact_match: false,
        };
  if (opts.facets) {
    params.facet_by = FACET_FIELDS_MAIN;
    params.max_facet_values = 40;
  }
  if (intent.sort === "price_asc") params.sort_by = "price:asc";
  if (intent.sort === "price_desc") params.sort_by = "price:desc";
  return { params, filter: params.filter_by as string, q };
}

/** Appends preferred words that the semantic query doesn't already mention. */
export function buildQ(semanticQuery: string, preferWords: string[]): string {
  const base = semanticQuery.trim() || "*";
  if (base === "*") return preferWords.length ? preferWords.join(" ") : "*";
  const lower = base.toLowerCase();
  const extra = [...new Set(preferWords)].filter((w) => w && !lower.includes(w)).slice(0, 6);
  return extra.length ? `${base} ${extra.join(" ")}` : base;
}
