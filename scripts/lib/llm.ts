/** Structured-output LLM calls for offline scripts, with an on-disk cache so re-runs are free. */
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { zodResponseFormat } from "openai/helpers/zod";
import type { z } from "zod";
import { getOpenAI } from "../../src/lib/openai";
import { ROOT } from "./io";

const CACHE_DIR = path.join(ROOT, ".cache", "llm");

// USD per 1M tokens, for the cost line in logs only.
const PRICES: Record<string, { in: number; out: number }> = {
  "gpt-4.1": { in: 2, out: 8 },
  "gpt-4.1-mini": { in: 0.4, out: 1.6 },
};

export const usage = { calls: 0, cached: 0, inTokens: 0, outTokens: 0, costUsd: 0 };

export async function llmParse<S extends z.ZodType>(opts: {
  model: string;
  name: string;
  schema: S;
  system: string;
  user: string;
}): Promise<z.infer<S>> {
  const key = createHash("sha256")
    .update(JSON.stringify([opts.model, opts.name, opts.system, opts.user]))
    .digest("hex")
    .slice(0, 32);
  const cacheFile = path.join(CACHE_DIR, `${opts.name}-${key}.json`);
  try {
    const cached = JSON.parse(await readFile(cacheFile, "utf8"));
    const parsed = opts.schema.safeParse(cached);
    if (parsed.success) {
      usage.cached++;
      return parsed.data;
    }
  } catch {
    // cache miss
  }

  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await getOpenAI().chat.completions.parse({
        model: opts.model,
        temperature: 0,
        messages: [
          { role: "system", content: opts.system },
          { role: "user", content: opts.user },
        ],
        response_format: zodResponseFormat(opts.schema, opts.name),
      });
      const msg = res.choices[0]?.message;
      if (msg?.refusal) throw new Error(`refused: ${msg.refusal}`);
      if (!msg?.parsed) throw new Error(`no parsed output (finish_reason ${res.choices[0]?.finish_reason})`);
      usage.calls++;
      const inT = res.usage?.prompt_tokens ?? 0;
      const outT = res.usage?.completion_tokens ?? 0;
      usage.inTokens += inT;
      usage.outTokens += outT;
      const price = PRICES[opts.model];
      if (price) usage.costUsd += (inT * price.in + outT * price.out) / 1e6;
      await mkdir(CACHE_DIR, { recursive: true });
      await writeFile(cacheFile, JSON.stringify(msg.parsed), "utf8");
      return msg.parsed as z.infer<S>;
    } catch (err) {
      lastErr = err;
      await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}
