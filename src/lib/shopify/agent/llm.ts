import OpenAI from "openai";
import { getShopifyEnv } from "../env";

/** OpenAI client for Genuine Finds (its own instance, separate from Drape's). */
let client: OpenAI | null = null;
export function openai(): OpenAI {
  const key = getShopifyEnv().OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is not set; Genuine Finds needs it.");
  client ??= new OpenAI({ apiKey: key });
  return client;
}

/** Reasoning models take `reasoning_effort` instead of `temperature`. */
export const isReasoning = (model: string) => /^(o\d|gpt-5)/i.test(model);
