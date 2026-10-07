/**
 * Applies database migrations and seeds demo content into an empty database.
 * Runs automatically before every build (`npm run build`), and on demand with `npm run db:setup`.
 */
import path from "node:path";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");

async function main() {
  const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

  if (!url) {
    if (process.env.VERCEL) {
      throw new Error(
        "DATABASE_URL is not set. Add your Neon connection string in Vercel → Project → Settings → Environment Variables, then redeploy.",
      );
    }
    // Embedded development database: opening it migrates and seeds.
    const { getDb, closeDb } = await import("../src/db");
    await getDb();
    await closeDb();
    console.log("[setup] Embedded development database is ready (./.data).");
    return;
  }

  const { Pool } = await import("pg");
  const { drizzle } = await import("drizzle-orm/node-postgres");
  const { migrate } = await import("drizzle-orm/node-postgres/migrator");
  const schema = await import("../src/db/schema");
  const { seedIfEmpty } = await import("../src/db/seed");

  const pool = new Pool({ connectionString: url, max: 1 });
  try {
    const db = drizzle(pool, { schema });
    await migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
    console.log("[setup] Migrations applied.");
    await seedIfEmpty(db);
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error("[setup] Failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
