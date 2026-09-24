/**
 * Refinement chat agent (brief §7): tool calling that drives the SAME results as the search page.
 * update_search / find_similar / compare / ask_user, at most 3 tool calls per turn.
 */
import type { ChatCompletionMessageParam, ChatCompletionTool } from "openai/resources/chat/completions";
import { z } from "zod";
import { getEnv } from "../env";
import { getOpenAI, isReasoningModel } from "../openai";
import { llmStructured, Usage } from "../llm";
import { vectorNeighbours, gendersLike, getEmbeddings } from "../similar";
import { mergeIntent, sanitizeIntent } from "./intent";
import type { TastePayload } from "./personalize";
import { runSearch } from "./pipeline";
import { intentSummary } from "./rerank";
import { getTaxonomy } from "./taxonomy";
import type { Emit, Intent, IntentPatch } from "./types";

export type Visible = { n: number; id: string; title: string; brand: string; color: string; price: number };
export type ChatMessage = { role: "user" | "assistant"; content: string };

const MAX_TOOL_CALLS = 3;

const constraintProps = {
  type: "object",
  properties: {
    include: { type: "array", items: { type: "string" }, description: "Complete new include list (canonical ids)" },
    exclude: { type: "array", items: { type: "string" }, description: "Complete new exclude list (canonical ids)" },
    strength: { type: "string", enum: ["must", "prefer"] },
  },
};

const intentPatchSchema = {
  type: "object",
  description: "Only the fields that change. Lists replace the current lists, so repeat what should stay.",
  properties: {
    semanticQuery: { type: "string", description: "Clean English description for embedding search" },
    audience: {
      type: "object",
      properties: {
        segment: { type: "string", enum: ["women", "men", "kids", "unisex", "unknown"] },
        kidGender: { type: ["string", "null"], enum: ["girl", "boy", "any", null] },
        ageYears: { type: ["number", "null"] },
      },
    },
    categories: constraintProps,
    colors: constraintProps,
    fabrics: constraintProps,
    patterns: constraintProps,
    fits: constraintProps,
    useCases: constraintProps,
    brands: constraintProps,
    price: {
      type: ["object", "null"],
      properties: { min: { type: ["number", "null"] }, max: { type: ["number", "null"] }, strength: { type: "string", enum: ["must", "prefer"] } },
    },
    sort: { type: "string", enum: ["relevance", "price_asc", "price_desc"] },
    softPreferences: { type: "array", items: { type: "string" } },
    textExclusions: { type: "array", items: { type: "string" } },
    mustKeywords: { type: "array", items: { type: "string" } },
  },
};

const TOOLS: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "update_search",
      description:
        "Change the current search and re-run it; the results grid and chips update. Use for cheaper/pricier, colours, fabrics, exclusions (no polyester), audience (show men's instead), fit/length (longer ones → softPreferences), occasion.",
      parameters: { type: "object", properties: { intentPatch: intentPatchSchema, note: { type: "string" } }, required: ["intentPatch"] },
    },
  },
  {
    type: "function",
    function: {
      name: "find_similar",
      description: 'Show products visually similar to a visible product ("like #3 but in blue"). Replaces the grid.',
      parameters: {
        type: "object",
        properties: {
          ref: { type: "integer", description: "The #n of a visible product" },
          changes: intentPatchSchema,
          label: { type: "string", description: 'Short change label, e.g. "in blue"' },
        },
        required: ["ref"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "compare",
      description: "Open the compare view for 2–3 visible products.",
      parameters: {
        type: "object",
        properties: { refs: { type: "array", items: { type: "integer" }, minItems: 2, maxItems: 3 }, criterion: { type: "string" } },
        required: ["refs"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "ask_user",
      description: "Ask one short question with 2–4 options. Use sparingly, only when the request is genuinely ambiguous.",
      parameters: {
        type: "object",
        properties: { question: { type: "string" }, options: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 4 } },
        required: ["question", "options"],
      },
    },
  },
];

const ReplySchema = z.object({ reply: z.string(), suggestions: z.array(z.string()) });

function systemPrompt(): string {
  const tax = getTaxonomy();
  return `You are Drape's refinement assistant for an Indian fashion search. The user is looking at a results grid and chats with you to change it.
- Prefer acting over talking: call update_search / find_similar / compare when the user wants different results. At most ${MAX_TOOL_CALLS} tool calls.
- "#3" refers to the visible product list. Use canonical ids from the vocabulary for constraint lists. Keep existing constraints unless the user changes them. "cheaper" → lower price max below most visible prices (must). "more colourful" → colors prefer [multicolor, pink, yellow…] and softPreferences "colourful". "no polyester" → fabrics.exclude += polyester. "only cotton" → fabrics include [cotton] must. "show men's instead" → audience segment men. "longer ones" → softPreferences "longer length".
- Style questions ("will this suit a pear body type?") are answered in text using only the product data you have. Never invent stock, sizes, delivery, discounts or materials.
- Replies: at most 2 sentences, warm and specific. Then 3 short follow-up suggestions relevant to the current results (e.g. "Under ₹1,500", "Show block prints", "Add a dupatta").

Vocabulary (ids):
${tax.promptVocabulary()}`;
}

export async function runRefine(
  input: { query: string; messages: ChatMessage[]; intent: Intent; visible: Visible[]; taste?: TastePayload; today?: Date; signal?: AbortSignal },
  emit: Emit,
): Promise<void> {
  const tax = getTaxonomy();
  const usage = new Usage();
  const model = getEnv().OPENAI_MODEL_FAST;
  let intent = input.intent;
  const context = [
    `Original query: ${input.query}`,
    `Current understanding: ${intentSummary(intent, tax)}`,
    `Current intent JSON: ${JSON.stringify(compactIntent(intent))}`,
    `Visible products:\n${input.visible.map((v) => `#${v.n} ${v.title} | ${v.brand} | ${v.color} | ₹${Math.round(v.price)}`).join("\n") || "(none)"}`,
    input.taste?.summary ? `Session taste (tie-breaks only): ${input.taste.summary}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt() },
    { role: "system", content: context },
    ...input.messages.slice(-10).map((m) => ({ role: m.role, content: m.content }) as ChatCompletionMessageParam),
  ];

  emit({ type: "step", id: "understand", label: "Thinking about your change", status: "running" });
  const t0 = performance.now();
  const first = await getOpenAI().chat.completions.create(
    {
      model,
      messages,
      tools: TOOLS,
      tool_choice: "auto",
      parallel_tool_calls: false,
      ...(isReasoningModel(model) ? { reasoning_effort: "low" as const } : { temperature: 0.2 }),
    },
    { timeout: 20_000, signal: input.signal },
  );
  usage.add("refine", model, performance.now() - t0, first.usage);
  emit({ type: "step", id: "understand", label: "Thinking about your change", status: "done", ms: Math.round(performance.now() - t0) });

  const msg = first.choices[0]?.message;
  const toolResults: string[] = [];
  for (const call of (msg?.tool_calls ?? []).slice(0, MAX_TOOL_CALLS)) {
    if (call.type !== "function") continue;
    let args: Record<string, unknown> = {};
    try {
      args = JSON.parse(call.function.arguments || "{}");
    } catch {
      toolResults.push(`${call.function.name}: invalid arguments`);
      continue;
    }
    if (call.function.name === "update_search") {
      intent = sanitizeIntent(mergeIntent(intent, (args.intentPatch ?? {}) as IntentPatch), tax, input.query);
      let found = 0;
      let note: string | undefined;
      await runSearch({ query: input.query, intent, taste: input.taste, today: input.today, signal: input.signal, noPlan: intent.kind === "product" }, (e) => {
        if (e.type === "results") {
          found += e.products.length;
          note = e.relaxedNote ?? note;
        }
        if (e.type !== "done") emit(e);
      });
      toolResults.push(`update_search: now showing ${found} products${note ? `; ${note}` : ""}. New understanding: ${intentSummary(intent, tax)}`);
    } else if (call.function.name === "find_similar") {
      const ref = input.visible.find((v) => v.n === Number(args.ref));
      if (!ref) {
        toolResults.push(`find_similar: #${args.ref} is not visible`);
        continue;
      }
      emit({ type: "step", id: "search", label: `Finding pieces like #${ref.n}`, status: "running" });
      const emb = (await getEmbeddings([ref.id])).get(ref.id);
      const changes = args.changes ? sanitizeIntent(mergeIntent({ ...intent, categories: { include: [], exclude: intent.categories.exclude, strength: "prefer" }, price: null }, args.changes as IntentPatch), tax) : undefined;
      const products = emb
        ? await vectorNeighbours({ vector: emb.vec, genders: gendersLike(emb.doc.gender), excludeIds: [ref.id], k: 36, intent: changes })
        : [];
      emit({ type: "step", id: "search", label: `Finding pieces like #${ref.n}`, status: "done" });
      const label = typeof args.label === "string" && args.label ? ` · ${args.label}` : "";
      emit({ type: "results", railId: "main", title: `Like ${ref.title}${label}`, products: products.slice(0, 24), more: products.slice(24), total: products.length });
      toolResults.push(`find_similar: showing ${products.length} products like #${ref.n}${label}`);
    } else if (call.function.name === "compare") {
      const ids = ((args.refs as number[]) ?? []).map((n) => input.visible.find((v) => v.n === n)?.id).filter((x): x is string => !!x);
      if (ids.length >= 2) emit({ type: "action", action: "compare", ids: ids.slice(0, 3), criterion: typeof args.criterion === "string" ? args.criterion : undefined });
      toolResults.push(`compare: opened ${ids.length} products`);
    } else if (call.function.name === "ask_user") {
      const options = Array.isArray(args.options) ? (args.options as string[]).slice(0, 4) : [];
      emit({ type: "ask", question: String(args.question ?? ""), options });
      toolResults.push("ask_user: question shown");
    }
  }

  // Final reply + follow-ups (structured), streamed to the drawer word by word.
  const reply = await llmStructured({
    name: "refine-reply",
    model,
    schema: ReplySchema,
    system: systemPrompt(),
    user: `${context}\n\nConversation:\n${input.messages
      .slice(-6)
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n")}\n\nActions taken: ${toolResults.join(" | ") || "none"}${msg?.content ? `\nDraft reply: ${msg.content}` : ""}\n\nWrite the reply (≤ 2 sentences, describe what changed) and exactly 3 follow-up suggestions.`,
    usage,
    signal: input.signal,
    timeoutMs: 15_000,
  });
  for (const word of reply.reply.split(/(\s+)/)) if (word) emit({ type: "text", delta: word });
  emit({ type: "suggestions", items: reply.suggestions.slice(0, 3) });
  emit({ type: "done", timings: { total: Math.round(performance.now() - t0) }, tokens: { in: usage.in, out: usage.out }, costUsd: +usage.costUsd.toFixed(5), cacheHit: false });
}

function compactIntent(i: Intent) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(i)) {
    if (v == null || (Array.isArray(v) && !v.length)) continue;
    if (typeof v === "object" && "include" in (v as object)) {
      const c = v as { include: string[]; exclude: string[] };
      if (!c.include.length && !c.exclude.length) continue;
    }
    out[k] = v;
  }
  return out;
}
