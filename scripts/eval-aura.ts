/**
 * Aura launch check: runs scripted conversations against a running app (npm run dev) and scores what a demo
 * depends on — results come back, in the right currency, within budget, Plush-style replies that end with a
 * question, and polite refusals for non-fashion.
 *
 * Usage: npm run eval:aura            (AURA_URL defaults to http://localhost:3000)
 */
import { toMinor } from "../src/lib/shopify/format";

const BASE = process.env.AURA_URL ?? "http://localhost:3000";

type Ev = { type: string; [k: string]: unknown };
type Case = { name: string; country?: string; turns: string[]; budget?: number; expect: "results" | "refusal" };

const CASES: Case[] = [
  { name: "western wear", turns: ["western wear for women"], expect: "results" },
  { name: "western wear + refine", turns: ["western wear for women", "ankle length, loose waist"], expect: "results" },
  { name: "wedding guest", turns: ["wedding guest outfit for women"], expect: "results" },
  { name: "kurta set budget", turns: ["cotton kurta set under 2000"], budget: 2000, expect: "results" },
  { name: "linen co-ord budget", turns: ["Linen co-ord set for a beach holiday, under ₹4,000"], budget: 4000, expect: "results" },
  { name: "men smart casual", turns: ["smart casual office outfit for men"], expect: "results" },
  { name: "white sneakers", turns: ["white sneakers that go with everything"], expect: "results" },
  { name: "kids party", turns: ["birthday party dress for a 6 year old girl"], expect: "results" },
  { name: "jewellery", turns: ["gold jhumka earrings for a sangeet"], expect: "results" },
  { name: "bag", turns: ["minimal leather tote that fits a laptop"], expect: "results" },
  { name: "hinglish", turns: ["shaadi ke liye lehenga under 10000"], budget: 10000, expect: "results" },
  { name: "us shopper", country: "US", turns: ["linen shirt for men under 80"], budget: 80, expect: "results" },
  { name: "refuse gadgets", turns: ["best wireless headphones"], expect: "refusal" },
  { name: "refuse home", turns: ["ceramic dinner set"], expect: "refusal" },
];

const CURRENCY: Record<string, string> = { IN: "INR", US: "USD" };

async function turn(body: Record<string, unknown>): Promise<Ev[]> {
  const res = await fetch(`${BASE}/api/shopify/chat`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  return text
    .split("\n\n")
    .map((b) => b.split("\n").find((l) => l.startsWith("data: ")))
    .filter((l): l is string => !!l)
    .map((l) => JSON.parse(l.slice(6)) as Ev);
}

async function run(c: Case) {
  const country = c.country ?? "IN";
  const state = { shown: [] as unknown[], nextRef: 1, remembered: [] as string[], history: [] as { role: string; content: string }[] };
  const checks: Record<string, boolean> = {};
  let ms = 0;
  for (const message of c.turns) {
    const t0 = Date.now();
    const events = await turn({ message, history: state.history, country, audience: null, remembered: state.remembered, excluded: [], shown: state.shown, nextRef: state.nextRef });
    ms = Date.now() - t0;
    const text = events.filter((e) => e.type === "text").map((e) => e.delta as string).join("");
    const sections = events.filter((e) => e.type === "section") as unknown as { products: { ref: number; id: string; title: string; seller: string | null; price: { amount: number; currency: string } | null }[] }[];
    const products = sections.flatMap((s) => s.products);
    for (const p of products) {
      state.shown.push({ ref: p.ref, id: p.id, title: p.title, store: p.seller, price: "?" });
      state.nextRef = Math.max(state.nextRef, p.ref + 1);
    }
    state.remembered = (events.findLast((e) => e.type === "chips")?.items as string[] | undefined) ?? state.remembered;
    state.history.push({ role: "user", content: message }, { role: "assistant", content: text });

    if (c.expect === "refusal") {
      checks.refused = products.length === 0 && /fashion/i.test(text);
    } else {
      checks.results = products.length > 0;
      checks.currency = products.every((p) => !p.price || p.price.currency === CURRENCY[country]);
      if (c.budget != null) checks.budget = products.every((p) => !p.price || p.price.amount <= toMinor(c.budget!, CURRENCY[country]));
      checks.endsWithQuestion = /\?\s*$/.test(text.trim());
      checks.noError = !events.some((e) => e.type === "error");
    }
  }
  return { checks, ms };
}

async function main() {
  console.log(`Aura eval against ${BASE}\n`);
  let pass = 0;
  let total = 0;
  const times: number[] = [];
  for (const c of CASES) {
    try {
      const { checks, ms } = await run(c);
      times.push(ms);
      const ok = Object.values(checks).every(Boolean);
      const failed = Object.entries(checks).filter(([, v]) => !v).map(([k]) => k);
      pass += Object.values(checks).filter(Boolean).length;
      total += Object.keys(checks).length;
      console.log(`${ok ? "✓" : "✗"} ${c.name.padEnd(24)} ${String(ms).padStart(6)}ms ${failed.length ? `failed: ${failed.join(", ")}` : ""}`);
    } catch (err) {
      total += 1;
      console.log(`✗ ${c.name.padEnd(24)} error: ${err instanceof Error ? err.message : err}`);
    }
  }
  times.sort((a, b) => a - b);
  console.log(`\nChecks passed: ${pass}/${total} · median turn ${times[Math.floor(times.length / 2)] ?? 0}ms · slowest ${times.at(-1) ?? 0}ms`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
