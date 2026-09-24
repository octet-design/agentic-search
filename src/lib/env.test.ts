import { describe, expect, it } from "vitest";
import { getEnv, parseTypesenseHost } from "./env";
import { isReasoningModel, suggestModel } from "./openai";

describe("parseTypesenseHost", () => {
  it("parses protocol, host and port", () => {
    expect(parseTypesenseHost("http://10.0.0.5:8108")).toEqual({
      protocol: "http",
      host: "10.0.0.5",
      port: 8108,
      path: "",
    });
  });

  it("defaults the scheme to http and ports by scheme", () => {
    expect(parseTypesenseHost("search.local:8108").protocol).toBe("http");
    expect(parseTypesenseHost("https://ts.example.com").port).toBe(443);
    expect(parseTypesenseHost("http://ts.example.com/").port).toBe(80);
  });

  it("keeps a path prefix without the trailing slash", () => {
    expect(parseTypesenseHost("https://proxy.example.com/typesense/").path).toBe("/typesense");
  });

  it("rejects non-http schemes", () => {
    expect(() => parseTypesenseHost("ftp://x:21")).toThrow(/http or https/);
  });
});

describe("getEnv", () => {
  const base = { TYPESENSE_HOST: "http://h:8108", TYPESENSE_SEARCH_KEY: "k", OPENAI_API_KEY: "o" };

  it("applies defaults and treats blank values as unset", () => {
    const env = getEnv({ ...base, OPENAI_MODEL_FAST: "  " });
    expect(env.OPENAI_MODEL_FAST).toBe("gpt-4.1-mini");
    expect(env.TYPESENSE_COLLECTION).toBe("products");
  });

  it("lists every missing variable", () => {
    expect(() => getEnv({ OPENAI_API_KEY: "o" })).toThrow(/TYPESENSE_HOST[\s\S]*TYPESENSE_SEARCH_KEY/);
  });
});

describe("model helpers", () => {
  it("detects reasoning models", () => {
    expect(isReasoningModel("o4-mini")).toBe(true);
    expect(isReasoningModel("gpt-5-mini")).toBe(true);
    expect(isReasoningModel("gpt-4.1-mini")).toBe(false);
  });

  it("suggests the preferred available fallback", () => {
    expect(suggestModel("gpt-4.1-mini", ["gpt-4o-mini", "gpt-4o"], "fast")).toBe("gpt-4o-mini");
    expect(suggestModel("gpt-4.1", ["gpt-4o", "gpt-4.1-mini"], "offline")).toBe("gpt-4o");
  });
});
