/**
 * Relaxation ladder (brief §6.4): one step at a time, never touching audience, exclusions or
 * textExclusions. Pure; unit-tested.
 */
import type { TaxonomyApi } from "./taxonomy";
import type { Intent } from "./types";

export type RelaxStep = { id: string; note: string; apply: (i: Intent) => Intent };

const clone = (i: Intent): Intent => structuredClone(i);
const fmt = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

export function relaxSteps(intent: Intent, tax: TaxonomyApi): RelaxStep[] {
  const steps: RelaxStep[] = [];
  const label = (field: Parameters<TaxonomyApi["label"]>[0], ids: string[]) =>
    ids.map((id) => tax.label(field, id).split("/")[0].trim().toLowerCase()).join(", ");

  if (intent.patterns.strength === "must" && intent.patterns.include.length) {
    steps.push({
      id: "pattern-prefer",
      note: `not only ${label("pattern", intent.patterns.include)} patterns`,
      apply: (i) => ({ ...clone(i), patterns: { ...i.patterns, strength: "prefer" } }),
    });
  }
  if (intent.fits.strength === "must" && intent.fits.include.length) {
    steps.push({
      id: "fit-prefer",
      note: `other fits besides ${label("fit", intent.fits.include)}`,
      apply: (i) => ({ ...clone(i), fits: { ...i.fits, strength: "prefer" } }),
    });
  }
  if (intent.colors.strength === "must" && intent.colors.include.length) {
    const extra = [...new Set(intent.colors.include.flatMap((id) => tax.related("color", id)))].filter(
      (id) => !intent.colors.include.includes(id) && !intent.colors.exclude.includes(id),
    );
    if (extra.length) {
      steps.push({
        id: "color-widen",
        note: `close shades (${label("color", extra)})`,
        apply: (i) => ({ ...clone(i), colors: { ...i.colors, include: [...i.colors.include, ...extra] } }),
      });
    }
  }
  if (intent.fabrics.strength === "must" && intent.fabrics.include.length) {
    const extra = [...new Set(intent.fabrics.include.flatMap((id) => tax.related("fabric", id)))].filter(
      (id) => !intent.fabrics.include.includes(id) && !intent.fabrics.exclude.includes(id),
    );
    if (extra.length) {
      steps.push({
        id: "fabric-widen",
        note: `similar fabrics (${label("fabric", extra)})`,
        apply: (i) => ({ ...clone(i), fabrics: { ...i.fabrics, include: [...i.fabrics.include, ...extra] } }),
      });
    }
  }
  const max = intent.price?.strength === "must" ? intent.price.max : null;
  if (max) {
    for (const pct of [20, 40]) {
      const widened = Math.round(max * (1 + pct / 100));
      steps.push({
        id: `price-${pct}`,
        note: `a few up to ${fmt(widened)}`,
        apply: (i) => ({ ...clone(i), price: i.price ? { ...i.price, max: widened } : i.price }),
      });
    }
  }
  if (intent.fabrics.strength === "must" && intent.fabrics.include.length) {
    steps.push({
      id: "fabric-prefer",
      note: "other fabrics",
      apply: (i) => ({ ...clone(i), fabrics: { ...i.fabrics, strength: "prefer" } }),
    });
  }
  if (intent.categories.strength === "must" && intent.categories.include.length) {
    const cats = intent.categories.include;
    const parents = [...new Set(cats.map((id) => tax.data.categories.find((c) => c.id === id)?.parent).filter((p): p is string => !!p))];
    if (parents.length) {
      steps.push({
        id: "category-parent",
        note: `other ${label("category", parents)} styles`,
        apply: (i) => ({ ...clone(i), categories: { ...i.categories, include: [...new Set([...i.categories.include, ...parents])] } }),
      });
    }
    const depts = [...new Set(cats.map((id) => tax.department(id)).filter((d): d is NonNullable<typeof d> => !!d))];
    const deptCats = [...new Set(depts.flatMap((d) => tax.categoriesInDepartment(d)))].filter(
      (id) => !intent.categories.exclude.includes(id),
    );
    if (deptCats.length > cats.length) {
      steps.push({
        id: "category-department",
        note: "related categories",
        apply: (i) => ({ ...clone(i), categories: { ...i.categories, include: deptCats } }),
      });
    }
  }
  return steps;
}

/** "Few exact matches, so also showing close shades (blue) and a few up to ₹3,600." */
export function relaxNote(applied: RelaxStep[]): string | undefined {
  if (!applied.length) return undefined;
  // Price steps replace each other; keep only the last one.
  const notes: string[] = [];
  let priceNote: string | null = null;
  for (const s of applied) {
    if (s.id.startsWith("price-")) priceNote = s.note;
    else notes.push(s.note);
  }
  if (priceNote) notes.push(priceNote);
  const list = notes.length > 1 ? `${notes.slice(0, -1).join(", ")} and ${notes[notes.length - 1]}` : notes[0];
  return `Few exact matches, so also showing ${list}.`;
}
