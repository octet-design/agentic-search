/** Fetch documents by id via search (document GET may be forbidden for the search-only key). */
import { hashKey, namedCache } from "./cache";
import { escapeFilterValue } from "./agent/filters";
import { multiSearch, toCard } from "./agent/retrieve";
import { getTaxonomy } from "./agent/taxonomy";
import type { ProductCard, RawProduct } from "./agent/types";

const cache = namedCache<ProductCard[]>("products", 500, 10 * 60_000);

export async function getProducts(ids: string[]): Promise<ProductCard[]> {
  const unique = [...new Set(ids.filter(Boolean))].slice(0, 100);
  if (!unique.length) return [];
  const key = hashKey(unique);
  const hit = cache.get(key);
  if (hit) return hit;
  const [res] = await multiSearch([
    {
      q: "*",
      query_by: "title",
      filter_by: `id:[${unique.map(escapeFilterValue).join(",")}]`,
      per_page: unique.length,
      exclude_fields: "embedding",
    },
  ]);
  const tax = getTaxonomy();
  const byId = new Map((res.hits ?? []).map((h) => [h.document.id, toCard(h.document as RawProduct, 0, tax)]));
  const out = unique.map((id) => byId.get(id)).filter((p): p is ProductCard => !!p);
  cache.set(key, out);
  return out;
}

/** Raw documents including descriptions (for compare / quick view details). */
export async function getRawProducts(ids: string[]): Promise<RawProduct[]> {
  const unique = [...new Set(ids.filter(Boolean))].slice(0, 20);
  if (!unique.length) return [];
  const [res] = await multiSearch([
    { q: "*", query_by: "title", filter_by: `id:[${unique.map(escapeFilterValue).join(",")}]`, per_page: unique.length, exclude_fields: "embedding" },
  ]);
  return (res.hits ?? []).map((h) => h.document as RawProduct);
}
