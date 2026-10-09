/**
 * Scout memory eval → docs/eval-memory-report.md. Plays separate chats in order, carrying memory between them the
 * way the browser does (lib/memory.ts), and checks facts are filed by person and used only for that person.
 * Usage: npm run eval:memory
 */
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { runChatTurn } from "../src/lib/agent/chatAgent";
import type { AgentEvent } from "../src/lib/agent/types";
import { mergeFacts, type MemoryItem, type MemoryPerson } from "../src/lib/memory";
import { ROOT } from "./lib/io";

type Step = {
  message: string;
  /** Facts that must be saved, as [person key, words the fact must contain]. */
  saves?: [string, RegExp][];
  /** Whose notes must be used ("self", "mom"), or null when none may be. */
  uses?: string | null;
  /** The reply must mention one of these (memory said naturally). */
  mentions?: RegExp;
  /** The reply must not mention these (another person's notes). */
  notMentions?: RegExp;
  /** After this step, these facts must be gone (replaced). */
  gone?: [string, RegExp][];
  /** Learned from ordinary chat (source "inferred"), as [person key, words]. */
  learns?: [string, RegExp][];
  /** Must NOT be learned (one-off choices), as [person key, words]. */
  noLearn?: [string, RegExp][];
};

const STEPS: Step[] = [
  { message: "Just so you know, I wear size M and I don't like polyester", saves: [["self", /\bM\b|medium/i], ["self", /polyester/i]] },
  { message: "suggest some casual kurtas for me", uses: "self", mentions: /\bM\b|medium|polyester/i },
  { message: "gift for my dad's birthday under 3000", uses: null, notMentions: /polyester|size M\b/i, noLearn: [["dad", /3,?000/], ["self", /3,?000/]] },
  { message: "my mom wears size L and she loves cotton sarees", saves: [["mom", /\bL\b|large/i], ["mom", /cotton/i]] },
  { message: "a saree for my mom for diwali", uses: "mom", mentions: /cotton|\bL\b|large/i, notMentions: /polyester/i },
  { message: "actually I'm size L now", saves: [["self", /\bL\b|large/i]], gone: [["self", /size M\b|\bM\b tops|medium/i]] },
  // Ordinary shopping chat, no "remember this": Scout should still learn.
  { message: "show me pastel cotton kurtas under 2000 for office", learns: [["self", /pastel/i], ["self", /cotton/i]] },
  { message: "a dress for a sunday brunch", uses: "self", mentions: /pastel|cotton/i },
  { message: "a red saree for my cousin's wedding this sunday", noLearn: [["self", /\bred\b/i]] },
];

let n = 0;
const newId = () => `m${++n}`;

async function main() {
  let people: MemoryPerson[] = [];
  const lines = ["# Scout memory eval", ""];
  let failed = 0;
  for (const [i, step] of STEPS.entries()) {
    // Every step is a NEW chat: memory is the only thing carried over.
    let text = "";
    let personalized: string[] = [];
    let forPerson: string | null | undefined;
    const heard: MemoryItem[] = [];
    // A dropped connection isn't a memory bug: retry the step once on a network error.
    for (let attempt = 0; attempt < 2; attempt++) {
      text = "";
      heard.length = 0;
      try {
        await runChatTurn(
          { message: step.message, history: [], state: { intent: null, lastSections: [], products: [], nextRef: 1 }, memory: [], people, style: "aura", blend: true },
          (e: AgentEvent) => {
            if (e.type === "chat_text") text = e.replace ? e.delta : text + e.delta;
            if (e.type === "chat_state") {
              personalized = e.personalized;
              forPerson = e.forPerson;
            }
            if (e.type === "memory") heard.push(...e.facts);
          },
        );
        break;
      } catch (err) {
        if (attempt === 1) throw err;
        console.log(`   (network error, retrying: ${err instanceof Error ? err.message : err})`);
      }
    }
    people = mergeFacts(people, heard, Date.now(), newId).people;
    const fails: string[] = [];
    const factsOf = (key: string) => people.find((p) => p.key === key)?.facts.map((f) => f.text) ?? [];
    for (const [key, re] of step.saves ?? []) if (!factsOf(key).some((t) => re.test(t))) fails.push(`not saved under ${key}: ${re}`);
    for (const [key, re] of step.gone ?? []) if (factsOf(key).some((t) => re.test(t))) fails.push(`old fact still under ${key}: ${re}`);
    const learnedOf = (key: string) => people.find((p) => p.key === key)?.facts.filter((f) => f.source === "inferred").map((f) => f.text) ?? [];
    for (const [key, re] of step.learns ?? []) if (!learnedOf(key).some((t) => re.test(t))) fails.push(`didn't learn for ${key}: ${re}`);
    for (const [key, re] of step.noLearn ?? []) if (learnedOf(key).some((t) => re.test(t))) fails.push(`learned a one-off for ${key}: ${re}`);
    const usedNote = personalized.find((p) => p.startsWith("Remembered about"));
    if (step.uses === null && usedNote) fails.push(`used notes for someone it shouldn't: "${usedNote}"`);
    if (step.uses && !usedNote) fails.push(`didn't use ${step.uses}'s notes`);
    if (step.uses && forPerson !== step.uses) fails.push(`request was for ${forPerson}, expected ${step.uses}`);
    if (step.mentions && !step.mentions.test(text)) fails.push(`reply didn't mention the notes (${step.mentions})`);
    if (step.notMentions && step.notMentions.test(text)) fails.push(`reply mentioned another person's notes (${step.notMentions})`);
    if (fails.length) failed++;
    console.log(`${i + 1}. ${fails.length ? "FAIL" : "pass"} ${step.message}${fails.length ? `\n     ${fails.join("\n     ")}` : ""}`);
    lines.push(
      `## ${i + 1}. ${step.message} ${fails.length ? "**FAIL**" : "✅"}`,
      "",
      `For: \`${forPerson ?? "nobody"}\` · ${usedNote ?? "no notes used"}`,
      "",
      `> ${text.replace(/\n+/g, " ")}`,
      "",
      `Heard: ${heard.map((h) => `${h.person}/${h.kind}/${h.source ?? "stated"}: ${h.text}`).join("; ") || "nothing"}`,
      "",
      ...fails.map((f) => `- ${f}`),
      "",
    );
  }
  lines.push("## Memory at the end", "", ...people.map((p) => `- **${p.label}**: ${p.facts.map((f) => `${f.text}${f.source === "inferred" ? " _(learned)_" : ""}`).join("; ")}`));
  lines.splice(1, 0, `${STEPS.length - failed}/${STEPS.length} steps passed. Each step is a new chat; only memory carries over.`, "");
  await writeFile(path.join(ROOT, "docs", "eval-memory-report.md"), lines.join("\n"), "utf8");
  console.log(`\n${STEPS.length - failed}/${STEPS.length} passed → docs/eval-memory-report.md`);
  process.exitCode = failed ? 1 : 0;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
