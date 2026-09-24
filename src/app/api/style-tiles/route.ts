import { namedCache } from "@/lib/cache";
import { andFilters, baseFilter } from "@/lib/agent/filters";
import { multiSearch } from "@/lib/agent/retrieve";
import { getTaxonomy } from "@/lib/agent/taxonomy";
import type { RawProduct } from "@/lib/agent/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// LLM + search work can take 10–25s; give it room on Vercel.
export const maxDuration = 60;

const STYLES = [
  { id: "minimal", label: "Minimal", q: "minimal solid neutral top" },
  { id: "ethnic-classic", label: "Ethnic classic", q: "classic silk saree" },
  { id: "boho", label: "Boho", q: "boho floral tiered maxi dress" },
  { id: "streetwear", label: "Streetwear", q: "oversized graphic hoodie streetwear" },
  { id: "old-money", label: "Old money", q: "beige linen classic shirt" },
  { id: "athleisure", label: "Athleisure", q: "athleisure co-ord joggers" },
  { id: "festive-glam", label: "Festive glam", q: "sequin embellished festive lehenga" },
  { id: "indo-western", label: "Indo-western", q: "indo western fusion jacket set" },
  { id: "workwear", label: "Workwear", q: "tailored formal blazer office" },
  { id: "party", label: "Party", q: "party bodycon satin dress" },
  { id: "comfy-basics", label: "Comfy basics", q: "cotton lounge t-shirt joggers" },
  { id: "bold-colour", label: "Bold colour", q: "bright colourful printed kurta" },
];

type Tile = { id: string; label: string; image: string | null };
const cache = namedCache<Tile[]>("style-tiles", 2, 12 * 60 * 60_000);

export async function GET() {
  const hit = cache.get("all");
  if (hit) return Response.json({ tiles: hit });
  const tax = getTaxonomy();
  try {
    const res = await multiSearch(
      STYLES.map((s) => ({
        q: s.q,
        query_by: "title,embedding",
        vector_query: "embedding:([], k: 30, alpha: 0.5)",
        filter_by: andFilters(baseFilter({ excludedGenders: tax.excludedGenders(), excludedCategoryValues: tax.excludedCategoryValues() })),
        per_page: 3,
        exclude_fields: "embedding,description",
      })),
    );
    const tiles = STYLES.map((s, i) => ({
      id: s.id,
      label: s.label,
      image: (res[i]?.hits ?? []).map((h) => (h.document as RawProduct).image_url).find(Boolean) ?? null,
    }));
    cache.set("all", tiles);
    return Response.json({ tiles });
  } catch {
    return Response.json({ tiles: STYLES.map((s) => ({ id: s.id, label: s.label, image: null })) });
  }
}
