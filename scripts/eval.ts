/**
 * Runs the search pipeline headless on the brief's 25 queries (§13.2) → docs/eval-report.md.
 * Usage: npm run eval [-- --only 1,4,20] [-- --no-rerank] [-- --concurrency 3]
 * Alpha can be tuned with DRAPE_ALPHA=0.3 npm run eval.
 */
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { runSearch } from "../src/lib/agent/pipeline";
import { makeChecker } from "../src/lib/agent/postFilter";
import { getTaxonomy } from "../src/lib/agent/taxonomy";
import type { AgentEvent, Intent, ProductCard, RawProduct } from "../src/lib/agent/types";
import { ROOT, mapLimit } from "./lib/io";

export const QUERIES = [
  "black cotton kurta set for office under 2000",
  "shaadi mein pehenne ke liye sherwani, ivory ya beige",
  "what should I wear to a mehendi in Jaipur in November",
  "floral maxi dress, no polyester",
  "everyday college sneakers for men under 3000",
  "birthday party dress for my 6 year old daughter",
  "old money look for men",
  "linen shirt that doesn't need much ironing",
  "saree for farewell — elegant, not too heavy",
  "high waist squat-proof gym leggings",
  "winter jacket for Manali in December, warm but not bulky, women",
  "gift for my dad's 60th birthday under 3000",
  "office wear for a pear body type",
  "navratri garba outfits for a couple",
  "white shirt",
  "kurti",
  "kuch accha sa dikhao party ke liye",
  "denim jacket like levis but cheaper",
  "school shoes for boys",
  "bodycon dress, no cutouts, not red",
  "diwali ethnic wear for a 2 year old boy",
  "monsoon footwear that won't get ruined",
  "interview outfit for a male fresher under 4000",
  "pastel co-ord set for brunch",
  "Goa trip outfits for a guy, 6000 total",
];

type RailOut = { railId: string; title?: string; products: ProductCard[]; relaxedNote?: string; total: number };
type Run = {
  n: number;
  query: string;
  intent?: Intent;
  chips: string[];
  clarify?: string;
  plan?: { note: string; rails: string[] };
  rails: RailOut[];
  debug?: { rails?: { id: string; filter: string; q: string; relaxed: string[]; found: number; rounds: { found: number; usable: number; ms: number }[] }[]; rerank?: unknown };
  done?: Extract<AgentEvent, { type: "done" }>;
  error?: string;
  fails: string[];
  ms: number;
};

const arg = (name: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
};

function checks(run: Run): string[] {
  const tax = getTaxonomy();
  const fails: string[] = [];
  if (!run.intent) return ["no intent"];
  const intent = run.intent;
  const checker = makeChecker({ ...intent, mustKeywords: [] }, tax);
  const genders = new Set(tax.audienceGenders(intent.audience));
  for (const rail of run.rails) {
    for (const p of rail.products) {
      const raw = { title: p.title, brand: p.brand, category: p.category, color: p.color, fabric: p.fabric ?? undefined, pattern: p.pattern ?? undefined, fit: p.fit ?? undefined, use_case: p.useCase } as RawProduct;
      const v = checker.violations(raw);
      if (v.length) fails.push(`EXCLUSION ${rail.railId}: "${p.title}" → ${v.join(", ")}`);
      if (genders.size && !genders.has(p.gender)) fails.push(`AUDIENCE ${rail.railId}: "${p.title}" is ${p.gender}`);
      if (intent.price?.strength === "must" && !rail.relaxedNote) {
        const { min, max } = intent.price;
        if ((max != null && p.price > max) || (min != null && p.price < min)) fails.push(`PRICE ${rail.railId}: "${p.title}" ₹${p.price}`);
      }
    }
  }
  if (!run.rails.some((r) => r.products.length)) fails.push("EMPTY: no results");
  return fails;
}

async function runOne(n: number, query: string, rerank: boolean): Promise<Run> {
  const run: Run = { n, query, chips: [], rails: [], fails: [], ms: 0 };
  const t0 = performance.now();
  try {
    await runSearch({ query, debug: true, rerank }, (e) => {
      if (e.type === "intent") {
        run.intent = e.intent;
        run.chips = e.chips.map((c) => c.label);
      } else if (e.type === "clarify") run.clarify = `${e.question} [${e.options.join(" / ")}]`;
      else if (e.type === "plan") run.plan = { note: e.stylistNote, rails: e.rails.map((r) => `${r.title} — ${r.why}`) };
      else if (e.type === "results") {
        const i = run.rails.findIndex((r) => r.railId === e.railId);
        const out = { railId: e.railId, title: e.title, products: e.products, relaxedNote: e.relaxedNote, total: e.total };
        if (i >= 0) run.rails[i] = out;
        else run.rails.push(out);
      } else if (e.type === "reasons") {
        const rail = run.rails.find((r) => r.railId === e.railId);
        for (const it of e.items) {
          const p = rail?.products.find((x) => x.id === it.id);
          if (p) Object.assign(p, { reason: it.reason, matched: it.matched });
        }
      } else if (e.type === "debug") run.debug = e.data as Run["debug"];
      else if (e.type === "done") run.done = e;
      else if (e.type === "error") run.error = e.message;
    });
  } catch (err) {
    run.error = err instanceof Error ? err.message : String(err);
  }
  run.ms = Math.round(performance.now() - t0);
  run.fails = run.error ? [`ERROR: ${run.error}`] : checks(run);
  return run;
}

const md = (s: string) => s.replace(/\|/g, "/").replace(/\n/g, " ");
const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

function compactIntent(i: Intent) {
  const out: Record<string, unknown> = { kind: i.kind, language: i.language, audience: i.audience, semanticQuery: i.semanticQuery };
  for (const [k, v] of Object.entries(i)) {
    if (k in out) continue;
    if (v && typeof v === "object" && "include" in v) {
      const c = v as { include: string[]; exclude: string[]; strength: string };
      if (c.include.length || c.exclude.length) out[k] = c;
    } else if (Array.isArray(v) ? v.length : v != null && v !== "relevance") out[k] = v;
  }
  return JSON.stringify(out);
}

function report(runs: Run[], opts: { rerank: boolean; alpha: string }): string {
  const fails = runs.filter((r) => r.fails.length);
  const lat = runs.map((r) => r.ms).sort((a, b) => a - b);
  const p50 = lat[Math.floor(lat.length / 2)];
  const tokensIn = runs.reduce((s, r) => s + (r.done?.tokens.in ?? 0), 0);
  const tokensOut = runs.reduce((s, r) => s + (r.done?.tokens.out ?? 0), 0);
  const cost = runs.reduce((s, r) => s + (r.done?.costUsd ?? 0), 0);
  const lines = [
    "# Eval report",
    "",
    `Generated ${new Date().toISOString()} · ${runs.length} queries · rerank ${opts.rerank ? "on" : "off"} · alpha ${opts.alpha}`,
    "",
    `**${runs.length - fails.length}/${runs.length} passed** automatic checks (exclusions, audience, price-when-unrelaxed). Latency p50 ${(p50 / 1000).toFixed(1)}s, max ${(lat[lat.length - 1] / 1000).toFixed(1)}s. Tokens ${Math.round(tokensIn / runs.length)} in / ${Math.round(tokensOut / runs.length)} out per query (avg). Total cost $${cost.toFixed(3)}.`,
    "",
    "| # | query | kind | rails | results | relaxed | total s | intent s | search s | curate s | tokens in/out | checks |",
    "|---:|---|---|---:|---:|---|---:|---:|---:|---:|---|---|",
    ...runs.map((r) => {
      const t = r.done?.timings ?? {};
      const results = r.rails.reduce((s, x) => s + x.products.length, 0);
      const relaxed = r.rails.some((x) => x.relaxedNote) ? "yes" : "";
      const s = (k: string) => (t[k] != null ? (t[k] / 1000).toFixed(1) : "");
      return `| ${r.n} | ${md(r.query)} | ${r.intent?.kind ?? ""} | ${r.rails.length} | ${results} | ${relaxed} | ${(r.ms / 1000).toFixed(1)} | ${s("understand")} | ${s("search")} | ${s("curate")} | ${r.done?.tokens.in ?? 0}/${r.done?.tokens.out ?? 0} | ${r.fails.length ? `**FAIL (${r.fails.length})**` : "pass"} |`;
    }),
    "",
  ];
  for (const r of runs) {
    lines.push(`## ${r.n}. ${r.query}`, "");
    if (r.error) lines.push(`**Error:** ${r.error}`, "");
    if (r.intent) lines.push("Intent:", "```json", compactIntent(r.intent), "```", "");
    if (r.chips.length) lines.push(`Chips: ${r.chips.map((c) => `\`${c}\``).join(" ")}`, "");
    if (r.clarify) lines.push(`Clarify: ${r.clarify}`, "");
    if (r.plan) lines.push(`Stylist note: ${r.plan.note}`, "", ...r.plan.rails.map((x) => `- ${x}`), "");
    for (const rail of r.rails) {
      const dbg = r.debug?.rails?.find((d) => d.id === rail.railId);
      lines.push(`### Rail \`${rail.railId}\`${rail.title ? ` — ${rail.title}` : ""} (${rail.products.length} shown, ${rail.total} found)`, "");
      if (dbg) {
        lines.push(`- q: \`${md(dbg.q)}\``, `- filter_by: \`${md(dbg.filter.length > 600 ? dbg.filter.slice(0, 600) + "…" : dbg.filter)}\``);
        lines.push(`- rounds: ${dbg.rounds.map((x) => `${x.found} found/${x.usable} usable (${x.ms}ms)`).join(" → ")}${dbg.relaxed.length ? ` · relaxed: ${dbg.relaxed.join(", ")}` : ""}`);
      }
      if (rail.relaxedNote) lines.push(`- note: ${rail.relaxedNote}`);
      lines.push("", "| title | brand | price | reason |", "|---|---|---:|---|");
      for (const p of rail.products.slice(0, 10)) lines.push(`| ${md(p.title)} | ${md(p.brand)} | ${inr(p.price)} | ${md(p.reason)} |`);
      lines.push("");
    }
    if (r.debug?.rerank) {
      const rr = r.debug.rerank as Record<string, { timeout?: boolean; scored?: number; kept?: number; dropped?: { why: string }[]; errors?: string[] }>;
      lines.push(
        `Rerank: ${Object.entries(rr)
          .map(([id, x]) => `${id} ${x.timeout ? "TIMEOUT (fallback reasons)" : `scored ${x.scored}, kept ${x.kept}, dropped ${x.dropped?.length ?? 0}${x.dropped?.length ? ` [${x.dropped.slice(0, 4).map((d) => md(d.why)).join("; ")}]` : ""}`}${x.errors?.length ? `, errors: ${md(x.errors[0]).slice(0, 120)}` : ""}`)
          .join(" · ")}`,
        "",
      );
    }
    if (r.done) lines.push(`Timings: ${Object.entries(r.done.timings).map(([k, v]) => `${k} ${v}ms`).join(", ")} · tokens ${r.done.tokens.in}/${r.done.tokens.out} · $${r.done.costUsd}`, "");
    if (r.fails.length) lines.push("**Checks failed:**", ...r.fails.slice(0, 15).map((f) => `- ${md(f)}`), "");
  }
  return lines.join("\n");
}

async function main() {
  const only = arg("only")?.split(",").map(Number);
  const rerank = !process.argv.includes("--no-rerank");
  const concurrency = Number(arg("concurrency") ?? 3);
  const picked = QUERIES.map((q, i) => ({ n: i + 1, q })).filter((x) => !only || only.includes(x.n));
  console.log(`Running ${picked.length} queries (rerank ${rerank ? "on" : "off"}, concurrency ${concurrency})…`);
  const runs = await mapLimit(picked, concurrency, async ({ n, q }) => {
    const r = await runOne(n, q, rerank);
    console.log(`${String(n).padStart(2)}. ${r.fails.length ? "FAIL" : "pass"} ${(r.ms / 1000).toFixed(1)}s  ${q}${r.fails.length ? `\n      ${r.fails.slice(0, 3).join("\n      ")}` : ""}`);
    return r;
  });
  runs.sort((a, b) => a.n - b.n);
  const file = path.join(ROOT, "docs", only ? "eval-report.partial.md" : "eval-report.md");
  await writeFile(file, report(runs, { rerank, alpha: process.env.DRAPE_ALPHA ?? "0.5" }), "utf8");
  const failed = runs.filter((r) => r.fails.length).length;
  console.log(`\n${runs.length - failed}/${runs.length} passed → ${path.relative(ROOT, file)}`);
  process.exitCode = failed ? 1 : 0;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
