import { z } from "zod";

/**
 * Server-side environment. Never import this from client components:
 * it reads secrets.
 */
const EnvSchema = z.object({
  TYPESENSE_HOST: z.string().min(1, "TYPESENSE_HOST is required (e.g. http://10.0.0.5:8108)"),
  TYPESENSE_SEARCH_KEY: z.string().min(1, "TYPESENSE_SEARCH_KEY is required"),
  TYPESENSE_COLLECTION: z.string().min(1).default("products"),

  OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required"),
  OPENAI_MODEL_FAST: z.string().min(1).default("gpt-4.1-mini"),
  OPENAI_MODEL_VISION: z.string().min(1).default("gpt-4.1-mini"),
  OPENAI_MODEL_OFFLINE: z.string().min(1).default("gpt-4.1"),

  NEXT_PUBLIC_APP_NAME: z.string().min(1).default("Drape"),
});

export type Env = z.infer<typeof EnvSchema>;

export type TypesenseNode = { protocol: "http" | "https"; host: string; port: number; path: string };

/** Parses `http://host:8108` (or a bare `host:8108`) into Typesense client node config. */
export function parseTypesenseHost(raw: string): TypesenseNode {
  const withScheme = /^[a-z]+:\/\//i.test(raw.trim()) ? raw.trim() : `http://${raw.trim()}`;
  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    throw new Error(`TYPESENSE_HOST is not a valid URL: "${raw}"`);
  }
  const protocol = url.protocol.replace(":", "");
  if (protocol !== "http" && protocol !== "https") {
    throw new Error(`TYPESENSE_HOST must use http or https, got "${protocol}"`);
  }
  const port = url.port ? Number(url.port) : protocol === "https" ? 443 : 80;
  const path = url.pathname === "/" ? "" : url.pathname.replace(/\/$/, "");
  return { protocol, host: url.hostname, port, path };
}

let cached: Env | null = null;

/** Validates env once and throws a readable error listing every problem. */
export function getEnv(source: Record<string, string | undefined> = process.env): Env {
  if (cached && source === process.env) return cached;
  // Treat empty strings as unset so `.default()` applies and `min(1)` reports cleanly.
  const cleaned = Object.fromEntries(
    Object.entries(source).filter(([, v]) => v !== undefined && v.trim() !== ""),
  );
  const parsed = EnvSchema.safeParse(cleaned);
  if (!parsed.success) {
    const lines = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`);
    throw new Error(`Invalid environment (see .env.example):\n${lines.join("\n")}`);
  }
  parseTypesenseHost(parsed.data.TYPESENSE_HOST);
  if (source === process.env) cached = parsed.data;
  return parsed.data;
}
