/** "Try asking" editorial cards; cover = first product of a cheap semantic search, cached (brief §9.1). */
import examples from "../../data/examples.json";
import { namedCache } from "./cache";
import { andFilters, baseFilter, inFilter } from "./agent/filters";
import { multiSearch } from "./agent/retrieve";
import { getTaxonomy } from "./agent/taxonomy";
import type { RawProduct } from "./agent/types";

export type Example = { query: string; title: string; image: string | null };

const covers = namedCache<string | null>("covers", 50, 6 * 60 * 60_000);

export async function getExamples(): Promise<Example[]> {
  const tax = getTaxonomy();
  const missing = examples.filter((e) => covers.get(e.query) === undefined);
  if (missing.length) {
    try {
      const res = await multiSearch(
        missing.map((e) => ({
          q: e.coverQuery,
          query_by: "title,embedding",
          vector_query: "embedding:([], k: 50, alpha: 0.5)",
          filter_by: andFilters(
            baseFilter({ excludedGenders: tax.excludedGenders(), excludedCategoryValues: tax.excludedCategoryValues() }),
            inFilter("gender", [e.coverGender]),
          ),
          per_page: 5,
          exclude_fields: "embedding,description",
        })),
      );
      missing.forEach((e, i) => {
        const hit = res[i]?.hits?.map((h) => h.document as RawProduct).find((d) => d.image_url);
        covers.set(e.query, hit?.image_url ?? null);
      });
    } catch {
      // Covers are decoration: render text-only cards if Typesense is unreachable.
    }
  }
  return examples.map((e) => ({ query: e.query, title: e.title, image: covers.get(e.query) ?? null }));
}
