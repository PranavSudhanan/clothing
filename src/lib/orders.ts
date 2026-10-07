import "server-only";

import { desc, eq } from "drizzle-orm";
import { connection } from "next/server";
import { getDb, schema } from "@/db";

// Customer-facing order reads. Never cached: status and payment change at any time.
// The token lookups call connection() first so they always run per request, never during a prerender.

export async function getOrderByToken(token: string) {
  if (!token || token.length > 64) return null;
  await connection();
  const db = await getDb();
  const order = await db.query.orders.findFirst({ where: eq(schema.orders.token, token), with: { items: true } });
  return order ?? null;
}

export async function getCoutureOrderByToken(token: string) {
  if (!token || token.length > 64) return null;
  await connection();
  const db = await getDb();
  const [order] = await db.select().from(schema.coutureOrders).where(eq(schema.coutureOrders.token, token)).limit(1);
  return order ?? null;
}

export async function getOrdersForUser(userId: string) {
  const db = await getDb();
  return db.query.orders.findMany({
    where: eq(schema.orders.userId, userId),
    with: { items: true },
    orderBy: [desc(schema.orders.createdAt)],
    limit: 50,
  });
}

export async function getCoutureOrdersForUser(userId: string) {
  const db = await getDb();
  return db
    .select()
    .from(schema.coutureOrders)
    .where(eq(schema.coutureOrders.userId, userId))
    .orderBy(desc(schema.coutureOrders.createdAt))
    .limit(50);
}
