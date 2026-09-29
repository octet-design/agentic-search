import { z } from "zod";

/**
 * Shopify Global Catalog settings. Deliberately separate from `@/lib/env`: the Shopify tab
 * must work without Typesense/OpenAI config, and Drape must work without this.
 */
const ShopifyEnvSchema = z.object({
  SHOPIFY_CATALOG_URL: z.url().default("https://catalog.shopify.com/api/ucp/mcp"),
  /**
   * Public URL of our UCP agent profile; Shopify fetches it on every call, so it can't be localhost.
   * Once deployed, point this at `<our domain>/ucp/agent-profile.json` (served from /public).
   */
  SHOPIFY_UCP_PROFILE_URL: z.url().default("https://shopify.dev/ucp/agent-profiles/examples/2026-08-25/valid-with-capabilities.json"),
  /** Buyer country (ISO 3166-1 alpha-2): drives prices, currency and what ships. */
  SHOPIFY_COUNTRY: z
    .string()
    .regex(/^[A-Z]{2}$/, "SHOPIFY_COUNTRY must be a 2-letter country code, e.g. IN")
    .default("IN"),
});

export type ShopifyEnv = z.infer<typeof ShopifyEnvSchema>;

let cached: ShopifyEnv | null = null;

export function getShopifyEnv(): ShopifyEnv {
  if (cached) return cached;
  const cleaned = Object.fromEntries(Object.entries(process.env).filter(([, v]) => v !== undefined && v.trim() !== ""));
  const parsed = ShopifyEnvSchema.safeParse(cleaned);
  if (!parsed.success) {
    const lines = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`);
    throw new Error(`Invalid Shopify environment (see .env.example):\n${lines.join("\n")}`);
  }
  cached = parsed.data;
  return cached;
}
