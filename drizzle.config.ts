import { defineConfig } from "drizzle-kit";

// Only used to generate SQL migrations (`npm run db:generate`).
// Migrations are applied by scripts/db-setup.ts, which runs before every build.
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
});
