/**
 * Shopify Agents (UCP over MCP) proof of concept: one command per capability, against live stores.
 * Standalone on purpose: no app code, no env needed except optional SHOPIFY_UCP_TOKEN / SHOPIFY_UCP_PROFILE_URL.
 *
 * Usage: npm run ucp -- <command> [args]
 *   tools    <store-domain>                         List the 13 tools a store exposes
 *   catalog  "<query>" [country]                    Global Catalog search across all Shopify stores
 *   filters  "<query>" [country]                    Same, with gender/colour, price tier and rating filters
 *   similar  <product-gid>                          "More like this" by product ID (Global Catalog `like`)
 *   image    <image-url> [country]                  Visual search: find products that look like a photo
 *   store    <store-domain> "<query>" [country]     Storefront Catalog: search one store
 *   cart     <store-domain> <variant-gid> [country] Cart MCP: create, update qty, read, then cancel (no token needed)
 *   checkout <store-domain> <variant-gid> [code]    Checkout MCP: create, add US address (+discount), show status, cancel
 *   order    <store-domain> <order-gid>             Order MCP: needs a Token-tier JWT (SHOPIFY_UCP_TOKEN)
 *
 * Nothing here can place an order: complete_checkout needs a Token-tier JWT and a payment credential.
 */
import { randomUUID } from "node:crypto";

const PROFILE = process.env.SHOPIFY_UCP_PROFILE_URL ?? "https://shopify.dev/ucp/agent-profiles/examples/2026-08-25/valid-with-capabilities.json";
const TOKEN = process.env.SHOPIFY_UCP_TOKEN;
const GLOBAL = "https://catalog.shopify.com/api/ucp/mcp";
// Some stores sit behind Cloudflare bot rules that reject non-browser user agents.
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36";

type Json = Record<string, unknown>;
type Result = { status: number; ok: boolean; data: Json | null; error: string | null; retryAfter: string | null };

const storeUrl = (domain: string) => `https://${domain.replace(/^https?:\/\//, "").replace(/\/.*$/, "")}/api/ucp/mcp`;

async function rpc(url: string, method: string, params?: Json): Promise<Result> {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
      "user-agent": UA,
      ...(TOKEN ? { authorization: `Bearer ${TOKEN}` } : {}),
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, ...(params ? { params } : {}) }),
  });
  const text = await res.text();
  let body: { result?: { isError?: boolean; structuredContent?: Json; content?: { text?: string }[]; tools?: unknown }; error?: { message?: string; data?: unknown } } = {};
  try {
    body = JSON.parse(text);
  } catch {
    return { status: res.status, ok: false, data: null, error: text.slice(0, 200), retryAfter: res.headers.get("retry-after") };
  }
  const err = body.error
    ? `${body.error.message}${body.error.data ? `: ${JSON.stringify(body.error.data).slice(0, 240)}` : ""}`
    : body.result?.isError
      ? (body.result.content?.[0]?.text ?? "tool error")
      : null;
  const data = (body.result?.structuredContent ?? (body.result as Json | undefined) ?? null) as Json | null;
  return { status: res.status, ok: !err, data, error: err, retryAfter: res.headers.get("retry-after") };
}

const tool = (url: string, name: string, args: Json, meta: Json = {}) =>
  rpc(url, "tools/call", { name, arguments: { meta: { "ucp-agent": { profile: PROFILE }, ...meta }, ...args } });

// ---------- printing ----------
const money = (m: { amount: number; currency: string } | undefined, currency?: string) => {
  if (!m && currency === undefined) return "—";
  const cur = m?.currency ?? currency ?? "USD";
  const amount = typeof m === "object" ? m.amount : 0;
  const digits = new Intl.NumberFormat("en", { style: "currency", currency: cur }).resolvedOptions().maximumFractionDigits ?? 2;
  return new Intl.NumberFormat("en", { style: "currency", currency: cur }).format(amount / 10 ** digits);
};
const minor = (amount: number, currency: string) => money({ amount, currency });
const step = (s: string) => console.log(`\n\x1b[1m▸ ${s}\x1b[0m`);
const note = (s: string) => console.log(`  \x1b[2m${s}\x1b[0m`);
function fail(r: Result, what: string): never | void {
  if (r.ok) return;
  console.log(`  ✗ ${what}: HTTP ${r.status} · ${r.error}${r.retryAfter ? ` · Retry-After ${r.retryAfter}s` : ""}`);
}

type Product = { id: string; title: string; price_range?: { min: { amount: number; currency: string } }; rating?: { value: number; count?: number }; variants: { id: string; seller?: { name?: string }; price?: { amount: number; currency: string }; availability?: { available?: boolean } }[] };
function printProducts(data: Json | null) {
  const products = (data?.products as Product[] | undefined) ?? [];
  if (!products.length) return note("no products");
  for (const p of products) {
    const v = p.variants[0];
    console.log(
      `  • ${p.title.slice(0, 60)}  ${money(p.price_range?.min ?? v?.price)}  ${v?.seller?.name ? `· ${v.seller.name}` : ""}${p.rating ? ` · ${p.rating.value}★ (${p.rating.count ?? "?"})` : ""}`,
    );
    note(`  product ${p.id} · variant ${v?.id}`);
  }
  const msgs = (data?.messages as { code?: string; content?: string }[] | undefined) ?? [];
  for (const m of msgs) note(`message: ${m.code} ${m.content ?? ""}`);
}

const ctx = (country = "IN") => {
  const currency = { IN: "INR", US: "USD", GB: "GBP", AE: "AED", CA: "CAD", AU: "AUD", DE: "EUR", FR: "EUR", JP: "JPY", SG: "SGD" }[country] ?? "USD";
  // Sending currency matters: without it Shopify reads price filters as USD.
  return { address_country: country, currency };
};

// ---------- commands ----------
const commands: Record<string, (a: string[]) => Promise<void>> = {
  async tools([domain]) {
    const r = await rpc(storeUrl(domain), "tools/list");
    fail(r, "tools/list");
    const list = (r.data?.tools as { name: string }[] | undefined) ?? [];
    console.log(`${list.length} tools at ${storeUrl(domain)}:\n  ${list.map((t) => t.name).join("\n  ")}`);
  },

  async catalog([query = "linen shirt", country = "IN"]) {
    step(`Global Catalog search "${query}" for buyers in ${country}`);
    const r = await tool(GLOBAL, "search_catalog", { catalog: { query, context: ctx(country), filters: { ships_to: { country } }, pagination: { limit: 6 } } });
    fail(r, "search_catalog");
    printProducts(r.data);
    note(`pagination: ${JSON.stringify(r.data?.pagination)}`);
  },

  async filters([query = "shirt", country = "IN"]) {
    step(`"${query}": women's, black, low price tier, rated ≥ 4.5 with ≥ 20 reviews`);
    const r = await tool(GLOBAL, "search_catalog", {
      catalog: {
        query,
        context: ctx(country),
        filters: {
          attributes: [
            { name: "Target gender", values: ["female"] },
            { name: "Color", values: ["Black"] },
          ],
          price_tier: ["low"],
          rating: { variant: { min: 4.5, min_count: 20 } },
        },
        pagination: { limit: 6 },
      },
    });
    fail(r, "search_catalog");
    printProducts(r.data);
  },

  async similar([gid, country = "IN"]) {
    if (!gid) throw new Error("usage: similar <gid://shopify/p/...>");
    step(`Products like ${gid}`);
    const r = await tool(GLOBAL, "search_catalog", { catalog: { like: [{ id: gid }], context: ctx(country), pagination: { limit: 6 } } });
    fail(r, "search_catalog like");
    printProducts(r.data);
  },

  async image([url, country = "IN"]) {
    if (!url) throw new Error("usage: image <image-url>");
    step(`Visual search from ${url.slice(0, 80)}`);
    const img = await fetch(url, { headers: { "user-agent": UA } });
    const data = Buffer.from(await img.arrayBuffer()).toString("base64");
    const r = await tool(GLOBAL, "search_catalog", {
      catalog: { like: [{ image: { content_type: img.headers.get("content-type") ?? "image/jpeg", data } }], context: ctx(country), pagination: { limit: 6 } },
    });
    fail(r, "search_catalog like image");
    printProducts(r.data);
  },

  async store([domain, query = "shirt", country = "IN"]) {
    if (!domain) throw new Error("usage: store <store-domain> <query>");
    step(`Storefront Catalog: "${query}" in ${domain}`);
    const r = await tool(storeUrl(domain), "search_catalog", { catalog: { query, context: ctx(country), pagination: { limit: 6 } } });
    fail(r, "search_catalog");
    printProducts(r.data);
  },

  async cart([domain, variant, country = "IN"]) {
    if (!domain || !variant) throw new Error("usage: cart <store-domain> <gid://shopify/ProductVariant/...>");
    const url = storeUrl(domain);
    type Cart = { id: string; currency: string; totals: { type: string; amount: number }[]; continue_url: string; expires_at: string; messages?: { code: string; content: string }[] };
    const show = (c: Cart) => {
      console.log(`  ${c.totals.map((t) => `${t.type} ${minor(t.amount, c.currency)}`).join(" · ")}`);
      for (const m of c.messages ?? []) note(`message: ${m.code} · ${m.content}`);
    };

    step("create_cart (no token: Cart MCP accepts anonymous agents)");
    const c1 = await tool(url, "create_cart", { cart: { line_items: [{ quantity: 1, item: { id: variant } }], context: { address_country: country } } });
    fail(c1, "create_cart");
    if (!c1.ok) return;
    const cart = c1.data as unknown as Cart;
    show(cart);
    note(`cart ${cart.id}\n    expires ${cart.expires_at}\n    buyer can open it: ${cart.continue_url}`);

    step("update_cart → quantity 2 + buyer email (full replacement: resend everything)");
    const c2 = await tool(url, "update_cart", { id: cart.id, cart: { line_items: [{ quantity: 2, item: { id: variant } }], context: { address_country: country }, buyer: { email: "poc@example.com" } } });
    fail(c2, "update_cart");
    if (c2.ok) show(c2.data as unknown as Cart);

    step("update_cart → quantity 999 (stock is enforced, with a warning)");
    const c3 = await tool(url, "update_cart", { id: cart.id, cart: { line_items: [{ quantity: 999, item: { id: variant } }], context: { address_country: country } } });
    fail(c3, "update_cart");
    if (c3.ok) show(c3.data as unknown as Cart);

    step("cancel_cart (needs an idempotency key)");
    const c4 = await tool(url, "cancel_cart", { id: cart.id }, { "idempotency-key": randomUUID() });
    fail(c4, "cancel_cart");
    if (c4.ok) console.log("  canceled");
  },

  async checkout([domain, variant, code]) {
    if (!domain || !variant) throw new Error("usage: checkout <store-domain> <gid://shopify/ProductVariant/...> [discount-code]");
    const url = storeUrl(domain);
    type Checkout = {
      id: string;
      status: string;
      currency: string;
      line_items: { id: string }[];
      totals: { type: string; amount: number }[];
      messages?: { code: string; severity?: string; content: string }[];
      discounts?: { applied?: { code: string; amount: number }[] };
      continue_url?: string;
      links?: { type: string; url: string }[];
    };
    const show = (c: Checkout) => {
      console.log(`  status: \x1b[1m${c.status}\x1b[0m`);
      console.log(`  ${c.totals.map((t) => `${t.type} ${minor(t.amount, c.currency)}`).join(" · ")}`);
      for (const m of c.messages ?? []) note(`[${m.severity ?? "info"}] ${m.code} · ${m.content}`);
      for (const d of c.discounts?.applied ?? []) note(`discount applied: ${d.code} −${minor(d.amount, c.currency)}`);
    };
    const base = { currency: "USD", line_items: [{ quantity: 1, item: { id: variant } }], buyer: { email: "poc@example.com" } };

    step("create_checkout (works without a token today; the docs say a token is required)");
    const r1 = await tool(url, "create_checkout", { checkout: base });
    fail(r1, "create_checkout");
    if (!r1.ok) return;
    const co = r1.data as unknown as Checkout;
    show(co);

    step(`update_checkout → US shipping address${code ? ` + discount ${code}` : ""}`);
    const r2 = await tool(url, "update_checkout", {
      id: co.id,
      checkout: {
        ...base,
        fulfillment: {
          methods: [
            {
              type: "shipping",
              line_item_ids: co.line_items.map((l) => l.id),
              destinations: [{ first_name: "Poc", last_name: "Tester", street_address: "350 5th Ave", address_locality: "New York", address_region: "NY", postal_code: "10118", address_country: "US" }],
            },
          ],
        },
        ...(code ? { discounts: { codes: [code] } } : {}),
      },
    });
    fail(r2, "update_checkout");
    if (r2.ok) {
      const c = r2.data as unknown as Checkout;
      show(c);
      note(`policies: ${(c.links ?? []).map((l) => l.type).join(", ")}`);
      note(`hand-off to buyer: ${c.continue_url}`);
    }

    step("complete_checkout (Token tier + payment credential only)");
    const r3 = await tool(url, "complete_checkout", { id: co.id, checkout: { payment: { instruments: [] } } }, { "idempotency-key": randomUUID() });
    fail(r3, "complete_checkout");

    step("cancel_checkout");
    const r4 = await tool(url, "cancel_checkout", { id: co.id }, { "idempotency-key": randomUUID() });
    fail(r4, "cancel_checkout");
    if (r4.ok) console.log(`  ${(r4.data as { status?: string } | null)?.status}`);
  },

  async order([domain, gid]) {
    if (!domain || !gid) throw new Error("usage: order <store-domain> <gid://shopify/Order/...>");
    step(`get_order ${gid}${TOKEN ? "" : " (no SHOPIFY_UCP_TOKEN set)"}`);
    const r = await tool(storeUrl(domain), "get_order", { id: gid });
    fail(r, "get_order");
    if (r.ok) console.log(JSON.stringify(r.data, null, 1).slice(0, 2000));
  },
};

async function main() {
  const [cmd, ...args] = process.argv.slice(2);
  const run = cmd && commands[cmd];
  if (!run) {
    console.log("Commands: " + Object.keys(commands).join(", ") + "\nSee the header of scripts/ucp-poc.ts for usage.");
    process.exit(cmd ? 1 : 0);
  }
  note(`profile ${PROFILE}${TOKEN ? " · Token tier" : " · Anonymous tier"}`);
  await run(args);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
