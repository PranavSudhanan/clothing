import type { NextConfig } from "next";

// Without DATABASE_URL the app uses an embedded Postgres that only one process can open,
// so local builds must prerender with a single worker. Builds against Neon run in parallel.
const embeddedDatabase = !process.env.DATABASE_URL;

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Native / WASM database drivers must be loaded from node_modules at runtime.
  serverExternalPackages: ["@electric-sql/pglite", "pg", "nodemailer", "country-state-city"],
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
    ...(embeddedDatabase ? { cpus: 1 } : {}),
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
