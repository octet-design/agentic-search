/**
 * Blend search relevance eval → docs/eval-blend-report.md.
 * Each query runs one Blend-search turn (catalog + Shopify) and checks that every product shown is an exact
 * match for its section's anchor, that ties go to our catalog, and that "no products found" shows when
 * neither source has the item. Usage: npm run eval:blend [-- --only 1,3]
 */
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { runChatTurn } from "../src/lib/agent/chatAgent";
import { getTaxonomy } from "../src/lib/agent/taxonomy";
import type { AgentEvent, Anchor, ProductCard } from "../src/lib/agent/types";
import { isExact } from "../src/lib/relevance";
import { ROOT, mapLimit } from "./lib/io";

const QUERIES: { q: string; audience?: "women" | "men" | "girls" | "boys"; expectEmpty?: boolean }[] = [
  { q: "chaniya choli", audience: "women" },
  { q: "bandhani saree", audience: "women" },
  { q: "kolhapuri chappal", audience: "women" },
  { q: "nehru jacket for men" },
  { q: "patola dupatta", audience: "women" },
  { q: "potli bag for a wedding", audience: "women" },
  { q: "linen kurta men" },
  { q: "zorblax quantum moonboots", expectEmpty: true },
];

type Section = { title: string; anchor?: Anchor; categories: string[]; products: ProductCard[]; emptyNote?: string };
type Row = { n: number; q: string; sections: Section[]; ms: number; timings?: Record<string, number>; fails: string[]; error?: string };

const arg = (name: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
};

async function run(n: number, spec: (typeof QUERIES)[number]): Promise<Row> {
  const tax = getTaxonomy();
  const row: Row = { n, q: spec.q, sections: [], ms: 0, fails: [] };
  const specs = new Map<string, string[]>();
  const t0 = performance.now();
  try {
    await runChatTurn(
      { message: spec.q, audience: spec.audience ?? null, history: [], state: { intent: null, lastSections: [], products: [], nextRef: 1 }, memory: [], style: "aura", blend: true },
      (e: AgentEvent) => {
        if (e.type === "chat_state") for (const s of e.lastSections) specs.set(s.title, s.categories);
        if (e.type === "done") row.timings = e.timings;
        if (e.type === "section") row.sections.push({ title: e.title, anchor: e.anchor, categories: specs.get(e.title) ?? [], products: e.products, emptyNote: e.emptyNote });
      },
    );
  } catch (err) {
    row.error = err instanceof Error ? err.message : String(err);
  }
  row.ms = Math.round(performance.now() - t0);

  if (row.error) row.fails.push(`ERROR: ${row.error}`);
  for (const s of row.sections) {
    if (!s.anchor?.terms.length) row.fails.push(`NO ANCHOR: "${s.title}"`);
    else for (const p of s.products) if (!isExact(p, s.anchor, s.categories, tax)) row.fails.push(`NOT EXACT "${s.title}": ${p.title} (${p.source ?? "typesense"})`);
    if (!s.products.length && !s.emptyNote) row.fails.push(`EMPTY WITHOUT NOTE: "${s.title}"`);
  }
  const shown = row.sections.flatMap((s) => s.products);
  if (spec.expectEmpty && shown.length) row.fails.push(`EXPECTED NO PRODUCTS, got ${shown.length}`);
  if (spec.expectEmpty && !row.sections.some((s) => s.emptyNote)) row.fails.push("EXPECTED a 'no products found' note");
  if (!spec.expectEmpty && !shown.length) row.fails.push("NO PRODUCTS");
  // Sections of one answer shouldn't mostly repeat each other.
  const ids = shown.map((p) => p.id);
  const repeats = ids.length - new Set(ids).size;
  if (ids.length >= 8 && repeats > ids.length / 4) row.fails.push(`REPEATS: ${repeats} of ${ids.length} shown products repeat across sections`);
  return row;
}

function report(rows: Row[]): string {
  const ok = rows.filter((r) => !r.fails.length).length;
  const med = [...rows.map((r) => r.ms)].sort((a, b) => a - b)[Math.floor(rows.length / 2)];
  const lines = [
    "# Blend search relevance report",
    "",
    `Generated ${new Date().toISOString()} · ${rows.length} queries · **${ok}/${rows.length} passed** (every shown product is an exact match for its section, empty sections say so, nonsense finds nothing) · median turn ${(med / 1000).toFixed(1)}s`,
    "",
  ];
  for (const r of rows) {
    lines.push(`## ${r.n}. ${r.q} ${r.fails.length ? "**FAIL**" : "✅"}`, "", `*${(r.ms / 1000).toFixed(1)}s${r.timings ? ` · ${Object.entries(r.timings).map(([k, v]) => `${k} ${(v / 1000).toFixed(1)}s`).join(", ")}` : ""}*`, "");
    for (const s of r.sections) {
      const counts = { t: s.products.filter((p) => p.source !== "shopify").length, s: s.products.filter((p) => p.source === "shopify").length };
      lines.push(`**${s.title}**: anchor ${s.anchor ? `\`${s.anchor.terms.join(" / ")}\`${s.anchor.categoryLevel ? " (category)" : ""}` : "_none_"} · ${counts.t} catalog + ${counts.s} Shopify`, "");
      if (s.emptyNote) lines.push(`> ${s.emptyNote}`, "");
      s.products.forEach((p, i) => lines.push(`${i + 1}. ${p.source === "shopify" ? "🛍 Shopify" : "📦 Typesense"} · ${p.title.replace(/\|/g, "/")} (${p.brand}, ₹${Math.round(p.price)})`));
      lines.push("");
    }
    if (r.fails.length) lines.push("**Checks failed:**", ...r.fails.slice(0, 12).map((f) => `- ${f}`), "");
  }
  return lines.join("\n");
}

async function main() {
  const only = arg("only")?.split(",").map(Number);
  const picked = QUERIES.map((q, i) => ({ n: i + 1, q })).filter((x) => !only || only.includes(x.n));
  console.log(`Running ${picked.length} blend queries…`);
  const rows = await mapLimit(picked, 3, async ({ n, q }) => {
    const r = await run(n, q);
    const shown = r.sections.flatMap((s) => s.products);
    console.log(`${String(n).padStart(2)}. ${r.fails.length ? "FAIL" : "pass"} ${(r.ms / 1000).toFixed(1).padStart(5)}s ${r.q}${r.timings ? ` [search ${((r.timings.search ?? 0) / 1000).toFixed(1)}s]` : ""} → ${shown.filter((p) => p.source !== "shopify").length} catalog + ${shown.filter((p) => p.source === "shopify").length} Shopify${r.fails.length ? `\n      ${r.fails.slice(0, 4).join("\n      ")}` : ""}`);
    return r;
  });
  rows.sort((a, b) => a.n - b.n);
  const file = path.join(ROOT, "docs", only ? "eval-blend-report.partial.md" : "eval-blend-report.md");
  await writeFile(file, report(rows), "utf8");
  const failed = rows.filter((r) => r.fails.length).length;
  console.log(`\n${rows.length - failed}/${rows.length} passed → ${path.relative(ROOT, file)}`);
  process.exitCode = failed ? 1 : 0;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
