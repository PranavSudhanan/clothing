import fs from "node:fs";
import path from "node:path";
import { attachDatabasePool } from "@vercel/functions";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

export type DB = NodePgDatabase<typeof schema>;
export { schema };

type Cache = { db?: Promise<DB>; close?: () => Promise<void> };
const globalCache = globalThis as unknown as { __atelierDb?: Cache };
const cache = (globalCache.__atelierDb ??= {});

/** True when no DATABASE_URL is configured and the embedded development database is in use. */
export function usingEmbeddedDb() {
  return !process.env.DATABASE_URL;
}

async function connect(): Promise<DB> {
  const url = process.env.DATABASE_URL;

  if (url) {
    const pool = new Pool({ connectionString: url, max: 5, idleTimeoutMillis: 5000 });
    attachDatabasePool(pool);
    cache.close = () => pool.end();
    return drizzle(pool, { schema });
  }

  if (process.env.VERCEL) {
    throw new Error(
      "DATABASE_URL is not set. Add your Neon connection string in Vercel → Project → Settings → Environment Variables.",
    );
  }

  // Local development without Postgres: an embedded Postgres (PGlite) stored in ./.data.
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle: drizzlePglite } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  const { seedIfEmpty } = await import("./seed");

  const root = /* turbopackIgnore: true */ process.cwd();
  const dataDir = path.join(root, ".data", "pglite");
  fs.mkdirSync(dataDir, { recursive: true });
  const client = new PGlite(dataDir);
  const embedded = drizzlePglite(client, { schema });
  await migrate(embedded, { migrationsFolder: path.join(root, "drizzle") });
  const db = embedded as unknown as DB;
  await seedIfEmpty(db);
  cache.close = () => client.close();
  return db;
}

export function getDb(): Promise<DB> {
  if (!cache.db) {
    cache.db = connect().catch((error) => {
      cache.db = undefined;
      throw error;
    });
  }
  return cache.db;
}

export async function closeDb() {
  await cache.close?.();
  cache.db = undefined;
  cache.close = undefined;
}
