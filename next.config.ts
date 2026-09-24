import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // taxonomy.ts reads data/taxonomy.json from disk at runtime; make sure serverless bundles include it.
  outputFileTracingIncludes: {
    "/**": ["./data/taxonomy.json"],
  },
};

export default nextConfig;
