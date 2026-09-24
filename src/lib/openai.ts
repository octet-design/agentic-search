import OpenAI from "openai";
import { getEnv } from "./env";

let client: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (client) return client;
  client = new OpenAI({ apiKey: getEnv().OPENAI_API_KEY });
  return client;
}

export type ModelCheck = {
  role: "fast" | "vision" | "offline";
  configured: string;
  available: boolean;
  suggestion: string | null;
};

// Fast, non-reasoning chat models, in order of preference, used for suggestions.
const FAST_FALLBACKS = ["gpt-4.1-mini", "gpt-4o-mini", "gpt-4.1-nano", "gpt-4.1", "gpt-4o"];
const OFFLINE_FALLBACKS = ["gpt-4.1", "gpt-4o", "gpt-4.1-mini"];

/** Reasoning-model ids need `reasoning_effort` set to the minimum (latency matters). */
export function isReasoningModel(id: string): boolean {
  return /^(o\d|gpt-5)/i.test(id);
}

export function suggestModel(
  configured: string,
  available: string[],
  role: ModelCheck["role"],
): string | null {
  const set = new Set(available);
  const prefs = role === "offline" ? OFFLINE_FALLBACKS : FAST_FALLBACKS;
  const direct = prefs.find((m) => set.has(m));
  if (direct) return direct;
  // Fall back to the closest-named available model (shared prefix), excluding reasoning models.
  const candidates = available.filter((m) => m.startsWith("gpt-") && !isReasoningModel(m));
  let best: string | null = null;
  let bestLen = 0;
  for (const m of candidates) {
    let i = 0;
    while (i < m.length && i < configured.length && m[i] === configured[i]) i++;
    if (i > bestLen) {
      best = m;
      bestLen = i;
    }
  }
  return best;
}

/** Checks the configured models against `models.list` and returns one row per role. */
export async function verifyModels(): Promise<ModelCheck[]> {
  const env = getEnv();
  const ids: string[] = [];
  for await (const m of getOpenAI().models.list()) ids.push(m.id);
  const set = new Set(ids);
  const roles: [ModelCheck["role"], string][] = [
    ["fast", env.OPENAI_MODEL_FAST],
    ["vision", env.OPENAI_MODEL_VISION],
    ["offline", env.OPENAI_MODEL_OFFLINE],
  ];
  return roles.map(([role, configured]) => {
    const available = set.has(configured);
    return {
      role,
      configured,
      available,
      suggestion: available ? null : suggestModel(configured, ids, role),
    };
  });
}

export function logModelChecks(checks: ModelCheck[]): void {
  for (const c of checks) {
    if (c.available) continue;
    console.warn(
      `[openai] OPENAI_MODEL_${c.role.toUpperCase()}="${c.configured}" is not available to this key.` +
        (c.suggestion ? ` Closest available: "${c.suggestion}".` : " No suitable fallback found."),
    );
  }
  for (const c of checks) {
    if (c.available && isReasoningModel(c.configured)) {
      console.warn(
        `[openai] "${c.configured}" is a reasoning model; calls will use the lowest reasoning effort.`,
      );
    }
  }
}
