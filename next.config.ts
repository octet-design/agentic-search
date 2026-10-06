import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // taxonomy.ts reads data/taxonomy.json from disk at runtime; make sure serverless bundles include it.
  outputFileTracingIncludes: {
    "/**": ["./data/taxonomy.json"],
  },
  // Genuine Finds became Aura; Blend search became Scout (chat links keep working).
  async redirects() {
    return [
      { source: "/finds", destination: "/aura", permanent: false },
      { source: "/finds/:path*", destination: "/aura", permanent: false },
      { source: "/blend", destination: "/scout", permanent: false },
      { source: "/blend/:path*", destination: "/scout/:path*", permanent: false },
    ];
  },
};

export default nextConfig;
