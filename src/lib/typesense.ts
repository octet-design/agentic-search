import { Client } from "typesense";
import { getEnv, parseTypesenseHost } from "./env";

// Server-side only: the search key must never reach the browser.
let client: Client | null = null;

export function getTypesense(): Client {
  if (client) return client;
  const env = getEnv();
  const node = parseTypesenseHost(env.TYPESENSE_HOST);
  client = new Client({
    nodes: [node],
    apiKey: env.TYPESENSE_SEARCH_KEY,
    connectionTimeoutSeconds: 10,
    numRetries: 1,
    logLevel: "warn",
  });
  return client;
}

export function productsCollection(): string {
  return getEnv().TYPESENSE_COLLECTION;
}
