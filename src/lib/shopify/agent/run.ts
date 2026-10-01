import type { ChatCompletionMessageParam, ChatCompletionMessageToolCall } from "openai/resources/chat/completions";
import { getCountry } from "../countries";
import { getShopifyEnv } from "../env";
import { createAnswerSplitter } from "./followups";
import { isReasoning, openai } from "./llm";
import { systemPrompt } from "./prompt";
import { ToolContext, TOOLS } from "./tools";
import type { ChatRequest, Emit } from "./types";

/** Model calls per turn (search → maybe refine → answer). The last one may not call tools. */
const MAX_ROUNDS = 4;
const MAX_TOOL_CALLS_PER_ROUND = 3;

type PendingCall = { id: string; name: string; args: string };

/** One conversational turn: stream the model, run its Shopify tool calls, stream the answer. */
export async function runFindsTurn(req: ChatRequest, emit: Emit, signal: AbortSignal): Promise<void> {
  const t0 = Date.now();
  const model = getShopifyEnv().SHOPIFY_AGENT_MODEL;
  const country = getCountry(req.country);
  const ctx = new ToolContext(country, req.shown, req.excluded, req.nextRef, emit, signal, req.sizes);

  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt({ country, audience: req.audience, remembered: req.remembered, excluded: req.excluded, shown: req.shown, sizes: req.sizes }) },
    ...req.history.map((h) => ({ role: h.role, content: h.content }) as ChatCompletionMessageParam),
    { role: "user", content: req.message },
  ];

  emit({ type: "status", label: "Thinking…" });

  for (let round = 0; round < MAX_ROUNDS; round++) {
    const last = round === MAX_ROUNDS - 1;
    const stream = await openai().chat.completions.create(
      {
        model,
        messages,
        tools: TOOLS,
        tool_choice: last ? "none" : "auto",
        parallel_tool_calls: true,
        stream: true,
        max_completion_tokens: 1000,
        ...(isReasoning(model) ? { reasoning_effort: "low" as const } : { temperature: 0.3 }),
      },
      { signal, timeout: 30_000, maxRetries: 1 },
    );

    const splitter = createAnswerSplitter();
    const calls: PendingCall[] = [];
    let text = "";
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      if (!delta) continue;
      if (delta.content) {
        text += delta.content;
        const visible = splitter.push(delta.content);
        if (visible) emit({ type: "text", delta: visible });
      }
      for (const tc of delta.tool_calls ?? []) {
        const c = (calls[tc.index] ??= { id: "", name: "", args: "" });
        if (tc.id) c.id = tc.id;
        if (tc.function?.name) c.name += tc.function.name;
        if (tc.function?.arguments) c.args += tc.function.arguments;
      }
    }

    const { rest, followups } = splitter.end();
    if (rest) emit({ type: "text", delta: rest });

    const pending = calls.filter((c) => c.id && c.name);
    if (!pending.length) {
      if (followups.length) emit({ type: "followups", items: followups });
      break;
    }

    // Separate any preamble text from what follows the tools.
    if (text.trim()) emit({ type: "text", delta: "\n\n" });
    const toolCalls: ChatCompletionMessageToolCall[] = pending.map((c) => ({ id: c.id, type: "function", function: { name: c.name, arguments: c.args } }));
    messages.push({ role: "assistant", content: text || null, tool_calls: toolCalls });

    const results = await Promise.all(
      pending.map((c, i) => (i < MAX_TOOL_CALLS_PER_ROUND ? ctx.run(c.name, c.args) : Promise.resolve({ error: "Too many tool calls at once; skipped." }))),
    );
    pending.forEach((c, i) => messages.push({ role: "tool", tool_call_id: c.id, content: JSON.stringify(results[i]) }));
    emit({ type: "status", label: "Writing your answer…" });
  }

  emit({ type: "done", ms: Date.now() - t0 });
}
