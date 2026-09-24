/**
 * Validates env and confirms Typesense + OpenAI are reachable.
 * Usage: npm run check
 */
import { getEnv, parseTypesenseHost } from "../src/lib/env";
import { getTypesense, productsCollection } from "../src/lib/typesense";
import { verifyModels, logModelChecks } from "../src/lib/openai";

async function main() {
  const env = getEnv();
  const node = parseTypesenseHost(env.TYPESENSE_HOST);
  console.log(`env ok · typesense ${node.protocol}://${node.host}:${node.port} · collection "${env.TYPESENSE_COLLECTION}"`);

  let ok = true;

  try {
    const t0 = performance.now();
    const res = await getTypesense()
      .collections(productsCollection())
      .documents()
      .search({ q: "*", query_by: "title", per_page: 0 });
    console.log(`typesense ok · ${res.found.toLocaleString("en-IN")} docs · ${Math.round(performance.now() - t0)}ms`);
  } catch (err) {
    ok = false;
    console.error(`typesense FAILED: ${err instanceof Error ? err.message : err}`);
  }

  try {
    const checks = await verifyModels();
    for (const c of checks) {
      console.log(`openai ${c.role.padEnd(7)} ${c.configured.padEnd(16)} ${c.available ? "ok" : "MISSING"}`);
    }
    logModelChecks(checks);
    if (checks.some((c) => !c.available)) ok = false;
  } catch (err) {
    ok = false;
    console.error(`openai FAILED: ${err instanceof Error ? err.message : err}`);
  }

  process.exit(ok ? 0 : 1);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
