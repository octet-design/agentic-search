/** Runtime structured-output calls with token/cost accounting (server-side only). */
import { zodResponseFormat } from "openai/helpers/zod";
import type { ChatCompletionContentPart, ChatCompletionMessageParam } from "openai/resources/chat/completions";
import type { z } from "zod";
import { getOpenAI, isReasoningModel } from "./openai";

// USD per 1M tokens (input, cached input, output). Unknown models are costed as gpt-4.1-mini.
const PRICES: Record<string, [number, number, number]> = {
  "gpt-4.1": [2, 0.5, 8],
  "gpt-4.1-mini": [0.4, 0.1, 1.6],
  "gpt-4.1-nano": [0.1, 0.025, 0.4],
  "gpt-4o": [2.5, 1.25, 10],
  "gpt-4o-mini": [0.15, 0.075, 0.6],
};

export class Usage {
  in = 0;
  cachedIn = 0;
  out = 0;
  costUsd = 0;
  calls: { name: string; model: string; ms: number; in: number; out: number }[] = [];

  add(name: string, model: string, ms: number, u?: { prompt_tokens?: number; completion_tokens?: number; prompt_tokens_details?: { cached_tokens?: number } | null } | null) {
    const inT = u?.prompt_tokens ?? 0;
    const cached = u?.prompt_tokens_details?.cached_tokens ?? 0;
    const outT = u?.completion_tokens ?? 0;
    const [pi, pc, po] = PRICES[model] ?? PRICES["gpt-4.1-mini"];
    this.in += inT;
    this.cachedIn += cached;
    this.out += outT;
    this.costUsd += ((inT - cached) * pi + cached * pc + outT * po) / 1e6;
    this.calls.push({ name, model, ms: Math.round(ms), in: inT, out: outT });
  }
}

export type LlmMessageContent = string | ChatCompletionContentPart[];

export async function llmStructured<S extends z.ZodType>(opts: {
  name: string;
  model: string;
  schema: S;
  system: string;
  user: LlmMessageContent;
  usage?: Usage;
  timeoutMs?: number;
  signal?: AbortSignal;
  maxTokens?: number;
  /** Non-reasoning models only; defaults to 0.2. */
  temperature?: number;
}): Promise<z.infer<S>> {
  const t0 = performance.now();
  const reasoning = isReasoningModel(opts.model);
  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: opts.system },
    { role: "user", content: opts.user } as ChatCompletionMessageParam,
  ];
  const res = await getOpenAI().chat.completions.parse(
    {
      model: opts.model,
      messages,
      response_format: zodResponseFormat(opts.schema, opts.name),
      // Latency over depth: lowest effort the model family accepts.
      ...(reasoning
        ? { reasoning_effort: /^gpt-5/i.test(opts.model) ? ("minimal" as const) : ("low" as const) }
        : { temperature: opts.temperature ?? 0.2 }),
      ...(opts.maxTokens ? { max_completion_tokens: opts.maxTokens } : {}),
    },
    { timeout: opts.timeoutMs ?? 20_000, maxRetries: 1, signal: opts.signal },
  );
  opts.usage?.add(opts.name, opts.model, performance.now() - t0, res.usage);
  const msg = res.choices[0]?.message;
  if (msg?.refusal) throw new Error(`${opts.name}: model refused`);
  if (!msg?.parsed) throw new Error(`${opts.name}: no structured output (${res.choices[0]?.finish_reason})`);
  return msg.parsed as z.infer<S>;
}

/** Races a promise against a timeout; resolves to `null` on timeout (the promise keeps running). */
export async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), ms);
  });
  try {
    return await Promise.race([p, timeout]);
  } finally {
    clearTimeout(timer);
  }
}
