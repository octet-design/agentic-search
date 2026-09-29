/**
 * Multi-turn conversational eval → docs/eval-chat-report.md.
 * Usage: npm run eval:chat [-- --only 1,3] [-- --concurrency 2]
 */
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { forSomeoneElse, runChatTurn, type ChatState } from "../src/lib/agent/chatAgent";
import type { TastePayload } from "../src/lib/agent/personalize";
import { makeChecker } from "../src/lib/agent/postFilter";
import { getTaxonomy } from "../src/lib/agent/taxonomy";
import type { AgentEvent, CompareBlockData, Intent, ProductCard, RawProduct } from "../src/lib/agent/types";
import { ROOT, mapLimit } from "./lib/io";

/** A user turn: typed text, or text sent by a card button with the products it points at (refs are hidden in the UI). */
type Turn = string | { text: string; refs: number[] };

export const CONVERSATIONS: Turn[][] = [
  ["office casual wear comfortable for women, no polyester", "cheaper", "is the second one breathable enough for a humid day?", { text: "Compare these", refs: [1, 9] }, "show men's instead"],
  ["what should I wear to a mehendi in Jaipur in November", "for women, total budget 5000", { text: "More like this, but in green", refs: [3] }],
  ["shaadi mein pehenne ke liye sherwani, ivory ya beige", "kuch sasta dikhao", "juttis bhi dikhao"],
  ["gift for my dad's 60th birthday under 3000", "he likes watches", { text: "Compare these", refs: [1, 2] }],
  ["birthday party dress for my 6 year old daughter", "not pink please", "which one is the most comfortable?"],
  ["bodycon dress, no cutouts, not red", "longer ones", { text: "Will this suit a pear body type?", refs: [2] }],
  ["Goa trip outfits for a guy, 6000 total", "add sunglasses too"],
  ["old money look for men", "just the shoes, cheaper"],
  ["hi", "I need a saree for my college farewell, elegant but not heavy"],
  ["gift ideas", "for my wife", "under 2000"],
  ["i want a purse for my wedding lehenga", "it's red with heavy gold zari work", "under 2000"],
  ["need some new tops for college", "something bolder than usual"],
  ["saree as a gift for my mom", "something in silk"],
  ["a kurta for a puja", "under 2500"],
];

/** "Shopping for" picker per conversation (1-based); the others start with "anyone". */
const PICKED: Record<number, "women" | "men" | "girls" | "boys"> = { 13: "men", 14: "men" };

/** Every turn carries the same learned taste, so the checks can see when it leaks where it shouldn't. */
const TASTE: TastePayload = {
  summary: "Likes colours: green, purple. Fabrics: cotton blend. Budget around ₹1,500–2,100.",
  audiences: [],
  budget: { min: 1500, max: 2100 },
  sizes: {},
  onlyMySize: false,
  avoidColors: [],
  avoidFabrics: [],
  likes: { colors: ["green", "purple"], fabrics: ["cotton blend"], brands: [], categories: [] },
  bucket: "eval",
};

type TurnOut = {
  message: string;
  turnType?: string;
  base?: Intent;
  chips: string[];
  intro: string;
  outro: string;
  answer: string;
  sections: { title: string; products: ProductCard[]; relaxedNote?: string }[];
  compare?: CompareBlockData;
  ask?: string;
  picks: { ref: number; headline: string; why: string; tip: string }[];
  personalized: string[];
  followups: string[];
  firstTextMs?: number;
  firstProductsMs?: number;
  totalMs: number;
  tokens: { in: number; out: number };
  costUsd: number;
  fails: string[];
  error?: string;
};

const arg = (name: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
};

/** Visible text names products as [name](#n) links; the UI shows a bare #n as the product's name, so only unknown refs fail. */
const unknownRef = (text: string, known: Set<number>) =>
  [...text.replace(/\[[^\]]*\]\(#\d{1,3}\)/g, "").matchAll(/#(\d{1,3})\b/g)].some((m) => !known.has(Number(m[1])));

function checkTurn(t: TurnOut, prevBase: Intent | undefined, prevAsk: string | undefined, known: Set<number>): string[] {
  const tax = getTaxonomy();
  const fails: string[] = [];
  if (t.error) return [`ERROR: ${t.error}`];
  if (!t.base) return ["no chat_state"];
  const base = t.base;
  const checker = makeChecker({ ...base, mustKeywords: [] }, tax);
  const genders = new Set(tax.audienceGenders(base.audience));
  for (const s of t.sections) {
    for (const p of s.products) {
      const raw = { title: p.title, brand: p.brand, category: p.category, color: p.color, fabric: p.fabric ?? undefined, pattern: p.pattern ?? undefined, fit: p.fit ?? undefined, use_case: p.useCase } as RawProduct;
      const v = checker.violations(raw);
      if (v.length) fails.push(`EXCLUSION "${s.title}": ${p.title} → ${v.join(", ")}`);
      if (genders.size && !genders.has(p.gender)) fails.push(`AUDIENCE "${s.title}": ${p.title} is ${p.gender}`);
      if (base.price?.strength === "must" && base.price.max && p.price > base.price.max && !s.relaxedNote) fails.push(`BUDGET "${s.title}": ${p.title} ₹${p.price} > ₹${base.price.max}`);
    }
  }
  // Exclusions stated earlier must survive later turns unless the user dropped them.
  if (prevBase && !/fine now|drop|ok with|okay with|remove/i.test(t.message)) {
    for (const f of ["colors", "fabrics", "patterns"] as const) {
      for (const id of prevBase[f].exclude) if (!base[f].exclude.includes(id)) fails.push(`STICKY: lost exclusion ${f}:${id}`);
    }
    for (const x of prevBase.textExclusions) if (!base.textExclusions.includes(x)) fails.push(`STICKY: lost text exclusion "${x}"`);
  }
  if ((t.turnType === "recommend" || t.turnType === "refine") && (t.sections.length < 1 || t.sections.length > 5)) fails.push(`SECTIONS: ${t.sections.length}`);
  if (t.turnType === "product_question" && t.answer.trim().length < 20) fails.push("ANSWER: empty");
  if (t.turnType === "compare" && (!t.compare || t.compare.products.length < 2)) fails.push("COMPARE: missing block");
  if (!t.intro.trim() && !t.answer.trim() && !t.compare) fails.push("TEXT: no reply text");
  // Guidance branch
  if (t.turnType === "recommend" && !/^\s*[-•*]\s+/m.test(t.intro)) fails.push("GUIDANCE: recommend intro has no guidance bullets");
  const shownRefs = new Set(t.sections.flatMap((s) => s.products.map((p) => p.ref)));
  if (t.sections.some((s) => s.products.length) && t.turnType !== "more_like" && t.picks.length < 2) fails.push(`PICKS: only ${t.picks.length} explained picks`);
  for (const x of t.picks) {
    if (!shownRefs.has(x.ref)) fails.push(`PICKS: #${x.ref} isn't in this turn's sections`);
    if (x.why.split(/\s+/).length < 15) fails.push(`PICKS: thin explanation for #${x.ref}`);
  }
  if ((t.turnType === "recommend" || t.turnType === "refine" || t.turnType === "clarify") && !t.ask) fails.push("ASK: no closing question");
  const norm = (q?: string) => (q ?? "").toLowerCase().replace(/\s*\[.*$/, "").replace(/[^a-z ]/g, "").trim();
  if (t.ask && prevAsk && norm(t.ask) === norm(prevAsk)) fails.push(`ASK: repeated "${t.ask}"`);
  for (const [k, v] of Object.entries({ intro: t.intro, outro: t.outro, answer: t.answer, ask: t.ask ?? "", followups: t.followups.join(" ") })) {
    if (unknownRef(v, known)) fails.push(`NUMBERS: unknown #n in ${k}`);
  }
  if (forSomeoneElse(t.message) && t.personalized.some((n) => /taste/i.test(n))) fails.push("TASTE: used the user's taste for someone else");
  if (base.price?.strength === "must" && base.price.min === TASTE.budget?.min && base.price.max === TASTE.budget?.max) fails.push("TASTE: learned budget became a hard filter");
  return fails;
}

async function runConversation(n: number, messages: Turn[], audience: (typeof PICKED)[number] | null = PICKED[n] ?? null) {
  let state: ChatState = { intent: null, lastSections: [], products: [], nextRef: 1 };
  const history: { role: "user" | "assistant"; content: string }[] = [];
  const turns: TurnOut[] = [];
  let prevBase: Intent | undefined;
  let prevAsk: string | undefined;
  for (const turn of messages) {
    const { text: message, refs } = typeof turn === "string" ? { text: turn, refs: [] } : turn;
    const t0 = performance.now();
    const t: TurnOut = { message: refs.length ? `${message} [refs ${refs.join(", ")}]` : message, chips: [], intro: "", outro: "", answer: "", sections: [], picks: [], personalized: [], followups: [], totalMs: 0, tokens: { in: 0, out: 0 }, costUsd: 0, fails: [] };
    try {
      await runChatTurn({ message, refs, audience, history, state, memory: [], taste: TASTE, debug: true }, (e: AgentEvent) => {
        const ms = Math.round(performance.now() - t0);
        if (e.type === "chat_text") {
          t.firstTextMs ??= ms;
          t[e.block] += e.delta;
        } else if (e.type === "section") {
          t.firstProductsMs ??= ms;
          t.sections.push({ title: e.title, products: e.products, relaxedNote: e.relaxedNote });
          state = {
            ...state,
            products: [...state.products, ...e.products.map((p) => ({ ref: p.ref!, id: p.id, title: p.title, brand: p.brand, color: p.color, fabric: p.fabric, category: p.category, price: p.price }))].slice(-120),
            nextRef: Math.max(state.nextRef, ...e.products.map((p) => (p.ref ?? 0) + 1)),
          };
        } else if (e.type === "chat_state") {
          t.base = e.intent;
          t.chips = e.chips.map((c) => c.label);
          t.personalized = e.personalized;
          state = { ...state, intent: e.intent, lastSections: e.lastSections };
        } else if (e.type === "compare") t.compare = e.data;
        else if (e.type === "picks") t.picks = e.items;
        else if (e.type === "ask") t.ask = `${e.question} [${e.options.join(" / ")}]`;
        else if (e.type === "suggestions") t.followups = e.items;
        else if (e.type === "debug") t.turnType = (e.data as { plan?: { turnType?: string } }).plan?.turnType;
        else if (e.type === "done") {
          t.tokens = e.tokens;
          t.costUsd = e.costUsd;
        }
      });
    } catch (err) {
      t.error = err instanceof Error ? err.message : String(err);
    }
    t.totalMs = Math.round(performance.now() - t0);
    t.fails = checkTurn(t, prevBase, prevAsk, new Set(state.products.map((p) => p.ref)));
    prevBase = t.base ?? prevBase;
    prevAsk = t.ask ?? prevAsk;
    turns.push(t);
    history.push({ role: "user", content: message });
    const shown = t.sections.filter((s) => s.products.length).map((s) => `${s.title} (#${s.products[0].ref}–#${s.products.at(-1)!.ref})`).join(", ");
    const tail = t.ask ? ` I asked: ${t.ask.replace(/\s*\[.*$/, "")}` : "";
    history.push({ role: "assistant", content: ([t.intro, t.answer, t.outro, shown ? `[Showed: ${shown}]` : ""].filter(Boolean).join(" ").slice(0, 1200 - tail.length) + tail).trim() });
  }
  return { n, turns };
}

const md = (s: string) => s.replace(/\|/g, "/").replace(/\n+/g, " ");
const sec = (ms?: number) => (ms == null ? "–" : `${(ms / 1000).toFixed(1)}s`);

function report(convs: { n: number; turns: TurnOut[] }[]): string {
  const turns = convs.flatMap((c) => c.turns);
  const failed = turns.filter((t) => t.fails.length);
  const med = (xs: number[]) => (xs.length ? [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)] : 0);
  const firstText = turns.map((t) => t.firstTextMs).filter((x): x is number => x != null);
  const firstProducts = turns.map((t) => t.firstProductsMs).filter((x): x is number => x != null);
  const lines = [
    "# Conversational eval report",
    "",
    `Generated ${new Date().toISOString()} · ${convs.length} conversations · ${turns.length} turns`,
    "",
    `**${turns.length - failed.length}/${turns.length} turns passed** automatic checks (exclusions, audience, strict budget, sticky exclusions, section count, answers, compare, guidance bullets, 2+ explained picks from the shown products, closing question, no repeated question, no visible #numbers, taste only where the intent calls for it). Every turn is sent the same learned taste (green, purple, cotton blend, ₹1,500–2,100) to catch leaks. Median first text ${sec(med(firstText))}, first products ${sec(med(firstProducts))}, full turn ${sec(med(turns.map((t) => t.totalMs)))}. Avg tokens ${Math.round(turns.reduce((s, t) => s + t.tokens.in, 0) / turns.length)} in / ${Math.round(turns.reduce((s, t) => s + t.tokens.out, 0) / turns.length)} out; total cost $${turns.reduce((s, t) => s + t.costUsd, 0).toFixed(3)}.`,
    "",
  ];
  for (const c of convs) {
    lines.push(`## Conversation ${c.n}${PICKED[c.n] ? ` (Shopping for: ${PICKED[c.n]})` : ""}`, "");
    for (const t of c.turns) {
      lines.push(`### 🧑 ${t.message}`, "", `*${t.turnType ?? "?"} · first text ${sec(t.firstTextMs)} · first products ${sec(t.firstProductsMs)} · total ${sec(t.totalMs)} · ${t.tokens.in}/${t.tokens.out} tokens* ${t.fails.length ? "**FAIL**" : "✅"}`, "");
      if (t.chips.length) lines.push(`Remembers: ${t.chips.map((x) => `\`${x}\``).join(" ")}`, "");
      if (t.personalized.length) lines.push(`Personalized: ${t.personalized.join(" · ")}`, "");
      if (t.intro) lines.push(`> ${md(t.intro)}`, "");
      for (const s of t.sections) {
        lines.push(`**${s.title}**${s.relaxedNote ? ` _(${s.relaxedNote})_` : ""}: ${s.products.slice(0, 4).map((p) => `#${p.ref} ${md(p.title)} (${p.brand}, ₹${Math.round(p.price)})`).join("; ") || "_none_"}`, "");
      }
      if (t.answer) lines.push(`> ${md(t.answer)}`, "");
      if (t.compare) {
        lines.push(`Compare: ${t.compare.products.map((p) => `#${p.ref} ${md(p.title)}`).join(" vs ")}`, "");
        lines.push(`Occasions: ${t.compare.occasions.map((o) => `${o.occasion} → ${o.best == null ? "tie" : `#${t.compare!.products[o.best].ref}`}`).join(", ")}`, "");
        lines.push(...t.compare.verdict.map((v) => `- ${md(v)}`), "");
      }
      if (t.picks.length) lines.push("Picks:", ...t.picks.map((x) => `- **#${x.ref} ${md(x.headline)}**: ${md(x.why)} _Tip: ${md(x.tip)}_`), "");
      if (t.outro) lines.push(`> ${md(t.outro)}`, "");
      if (t.ask) lines.push(`Asks: ${md(t.ask)}`, "");
      if (t.followups.length) lines.push(`Follow-ups: ${t.followups.map((f) => `\`${f}\``).join(" ")}`, "");
      if (t.fails.length) lines.push("**Checks failed:**", ...t.fails.slice(0, 10).map((f) => `- ${md(f)}`), "");
    }
  }
  return lines.join("\n");
}

async function main() {
  const only = arg("only")?.split(",").map(Number);
  const concurrency = Number(arg("concurrency") ?? 2);
  const picked = CONVERSATIONS.map((m, i) => ({ n: i + 1, m })).filter((x) => !only || only.includes(x.n));
  console.log(`Running ${picked.length} conversations (concurrency ${concurrency})…`);
  const convs = await mapLimit(picked, concurrency, async ({ n, m }) => {
    const c = await runConversation(n, m);
    for (const t of c.turns) console.log(`${String(n).padStart(2)}. ${t.fails.length ? "FAIL" : "pass"} ${sec(t.totalMs).padStart(6)} ${(t.turnType ?? "?").padEnd(16)} ${t.message}${t.fails.length ? `\n      ${t.fails.slice(0, 3).join("\n      ")}` : ""}`);
    return c;
  });
  convs.sort((a, b) => a.n - b.n);
  const file = path.join(ROOT, "docs", only ? "eval-chat-report.partial.md" : "eval-chat-report.md");
  await writeFile(file, report(convs), "utf8");
  const turns = convs.flatMap((c) => c.turns);
  const failed = turns.filter((t) => t.fails.length).length;
  console.log(`\n${turns.length - failed}/${turns.length} turns passed → ${path.relative(ROOT, file)}`);
  process.exitCode = failed ? 1 : 0;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
