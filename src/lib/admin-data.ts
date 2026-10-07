import "server-only";

import { and, asc, count, desc, eq, gte, ilike, inArray, lte, ne, or, sql, type SQL } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { requireAdmin } from "./auth";
import { DEFAULT_CONFIG, mergeConfig } from "./defaults";
import type { SiteConfig } from "./types";

// Every read here checks the admin session first, so a page can never leak data by forgetting to.
// Correlated subqueries use explicit aliases: Drizzle omits the table prefix from interpolated
// columns in single-table selects, which would make inner and outer `id` columns collide.

const {
  banners,
  categories,
  coupons,
  coutureOrders,
  coutureServices,
  enquiries,
  fabrics,
  media,
  orders,
  pages,
  productVariants,
  products,
  settings,
  subscribers,
  users,
} = schema;

async function adminDb() {
  await requireAdmin();
  return getDb();
}

/** Settings straight from the database — the admin always edits the latest saved values. */
export async function adminConfig(): Promise<SiteConfig> {
  const db = await adminDb();
  const rows = await db.select().from(settings);
  return mergeConfig(DEFAULT_CONFIG, Object.fromEntries(rows.filter((r) => !r.key.startsWith("_")).map((r) => [r.key, r.value])));
}

export async function adminDashboard() {
  const db = await adminDb();
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const config = await adminConfig();
  const live = ne(orders.status, "cancelled");

  const [[sales], [pending], [openCouture], [customers], [unread], recentOrders, recentCouture, lowStock, daily] = await Promise.all([
    db
      .select({ revenue: sql<number>`coalesce(sum(${orders.total}), 0)::float`, orders: count() })
      .from(orders)
      .where(and(live, gte(orders.createdAt, since))),
    db.select({ n: count() }).from(orders).where(inArray(orders.status, ["pending", "confirmed", "processing"])),
    db.select({ n: count() }).from(coutureOrders).where(sql`${coutureOrders.status} not in ('delivered', 'cancelled')`),
    db.select({ n: count() }).from(users).where(eq(users.role, "customer")),
    db.select({ n: count() }).from(enquiries).where(eq(enquiries.status, "new")),
    db.select().from(orders).orderBy(desc(orders.createdAt)).limit(6),
    db.select().from(coutureOrders).orderBy(desc(coutureOrders.createdAt)).limit(5),
    db
      .select({
        id: productVariants.id,
        productId: products.id,
        name: products.name,
        size: productVariants.size,
        color: productVariants.color,
        stock: productVariants.stock,
      })
      .from(productVariants)
      .innerJoin(products, eq(products.id, productVariants.productId))
      .where(and(eq(products.status, "active"), lte(productVariants.stock, config.commerce.lowStockThreshold)))
      .orderBy(asc(productVariants.stock), asc(products.name))
      .limit(8),
    db
      .select({
        day: sql<string>`to_char(${orders.createdAt} at time zone 'Asia/Kolkata', 'YYYY-MM-DD')`,
        revenue: sql<number>`coalesce(sum(${orders.total}), 0)::float`,
      })
      .from(orders)
      .where(and(live, gte(orders.createdAt, new Date(Date.now() - 14 * 24 * 60 * 60 * 1000))))
      .groupBy(sql`1`),
  ]);

  // Fill the gaps so the chart always shows 14 consecutive days.
  const byDay = new Map(daily.map((d) => [d.day, d.revenue]));
  const chart = Array.from({ length: 14 }, (_, i) => {
    const date = new Date(Date.now() + 5.5 * 60 * 60 * 1000 - (13 - i) * 24 * 60 * 60 * 1000);
    const key = date.toISOString().slice(0, 10);
    return { day: key, revenue: byDay.get(key) ?? 0 };
  });

  return {
    config,
    revenue: sales.revenue,
    orderCount: sales.orders,
    pending: pending.n,
    openCouture: openCouture.n,
    customers: customers.n,
    unread: unread.n,
    recentOrders,
    recentCouture,
    lowStock,
    chart,
  };
}

export async function adminOrders(filter: { status?: string; q?: string }) {
  const db = await adminDb();
  const where: (SQL | undefined)[] = [];
  if (filter.status) where.push(eq(orders.status, filter.status));
  if (filter.q) {
    const term = `%${filter.q.replace(/[%_]/g, "")}%`;
    where.push(or(ilike(orders.number, term), ilike(orders.name, term), ilike(orders.email, term), ilike(orders.phone, term)));
  }
  const rows = await db
    .select({
      id: orders.id,
      number: orders.number,
      name: orders.name,
      email: orders.email,
      total: orders.total,
      status: orders.status,
      paymentMethod: orders.paymentMethod,
      paymentStatus: orders.paymentStatus,
      createdAt: orders.createdAt,
      items: sql<number>`(select coalesce(sum(oi.qty), 0)::int from order_items oi where oi.order_id = "orders"."id")`,
    })
    .from(orders)
    .where(and(...where))
    .orderBy(desc(orders.createdAt))
    .limit(200);
  const counts = await db.select({ status: orders.status, n: count() }).from(orders).groupBy(orders.status);
  return { rows, counts: Object.fromEntries(counts.map((c) => [c.status, c.n])) as Record<string, number> };
}

export async function adminOrder(id: string) {
  const db = await adminDb();
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  return (await db.query.orders.findFirst({ where: eq(orders.id, id), with: { items: true } })) ?? null;
}

export async function adminCoutureOrders(filter: { status?: string; q?: string }) {
  const db = await adminDb();
  const where: (SQL | undefined)[] = [];
  if (filter.status) where.push(eq(coutureOrders.status, filter.status));
  if (filter.q) {
    const term = `%${filter.q.replace(/[%_]/g, "")}%`;
    where.push(or(ilike(coutureOrders.number, term), ilike(coutureOrders.name, term), ilike(coutureOrders.email, term), ilike(coutureOrders.phone, term)));
  }
  const rows = await db.select().from(coutureOrders).where(and(...where)).orderBy(desc(coutureOrders.createdAt)).limit(200);
  const counts = await db.select({ status: coutureOrders.status, n: count() }).from(coutureOrders).groupBy(coutureOrders.status);
  return { rows, counts: Object.fromEntries(counts.map((c) => [c.status, c.n])) as Record<string, number> };
}

export async function adminCoutureOrder(id: string) {
  const db = await adminDb();
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const [order] = await db.select().from(coutureOrders).where(eq(coutureOrders.id, id)).limit(1);
  return order ?? null;
}

export async function adminProducts(q?: string) {
  const db = await adminDb();
  const term = q ? `%${q.replace(/[%_]/g, "")}%` : null;
  return db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      image: sql<string>`coalesce(${products.images}->>0, '')`,
      price: products.price,
      compareAtPrice: products.compareAtPrice,
      status: products.status,
      featured: products.featured,
      isNew: products.isNew,
      category: categories.name,
      stock: sql<number>`(select coalesce(sum(pv.stock), 0)::int from product_variants pv where pv.product_id = "products"."id")`,
      variants: sql<number>`(select count(*)::int from product_variants pv where pv.product_id = "products"."id")`,
    })
    .from(products)
    .leftJoin(categories, eq(categories.id, products.categoryId))
    .where(term ? or(ilike(products.name, term), ilike(products.slug, term)) : undefined)
    .orderBy(desc(products.createdAt))
    .limit(500);
}

export async function adminProduct(id: string) {
  const db = await adminDb();
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  return (await db.query.products.findFirst({ where: eq(products.id, id), with: { variants: true } })) ?? null;
}

export async function adminCategories() {
  const db = await adminDb();
  return db.select().from(categories).orderBy(asc(categories.sort), asc(categories.name));
}

export async function adminResource(resource: "banners" | "categories" | "coupons" | "fabrics" | "services") {
  const db = await adminDb();
  switch (resource) {
    case "banners":
      return db.select().from(banners).orderBy(asc(banners.placement), asc(banners.sort));
    case "categories":
      return db.select().from(categories).orderBy(asc(categories.sort), asc(categories.name));
    case "coupons":
      return db.select().from(coupons).orderBy(asc(coupons.code));
    case "fabrics":
      return db.select().from(fabrics).orderBy(asc(fabrics.sort), asc(fabrics.name));
    case "services":
      return db.select().from(coutureServices).orderBy(asc(coutureServices.sort), asc(coutureServices.name));
  }
}

/** Option lists for pickers inside admin forms. */
export async function adminRefs() {
  const db = await adminDb();
  const [cats, prods, fabs, placements] = await Promise.all([
    db.select({ slug: categories.slug, name: categories.name }).from(categories).orderBy(asc(categories.sort)),
    db
      .select({ id: products.id, name: products.name, image: sql<string>`coalesce(${products.images}->>0, '')` })
      .from(products)
      .orderBy(asc(products.name))
      .limit(500),
    db.select({ id: fabrics.id, name: fabrics.name, hex: fabrics.hex }).from(fabrics).orderBy(asc(fabrics.sort)),
    db.selectDistinct({ placement: banners.placement }).from(banners),
  ]);
  return { categories: cats, products: prods, fabrics: fabs, placements: placements.map((p) => p.placement) };
}

export type AdminRefs = Awaited<ReturnType<typeof adminRefs>>;

export async function adminPages() {
  const db = await adminDb();
  return db.select().from(pages).orderBy(desc(pages.system), asc(pages.title));
}

export async function adminPage(id: string) {
  const db = await adminDb();
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const [page] = await db.select().from(pages).where(eq(pages.id, id)).limit(1);
  return page ?? null;
}

export async function adminCustomers() {
  const db = await adminDb();
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      createdAt: users.createdAt,
      orders: sql<number>`(select count(*)::int from orders o where o.user_id = "users"."id")`,
      spent: sql<number>`(select coalesce(sum(o.total), 0)::float from orders o where o.user_id = "users"."id" and o.status <> 'cancelled')`,
      couture: sql<number>`(select count(*)::int from couture_orders co where co.user_id = "users"."id")`,
    })
    .from(users)
    .where(eq(users.role, "customer"))
    .orderBy(desc(users.createdAt))
    .limit(500);
}

export async function adminInbox() {
  const db = await adminDb();
  const [messages, subs] = await Promise.all([
    db.select().from(enquiries).orderBy(desc(enquiries.createdAt)).limit(200),
    db.select().from(subscribers).orderBy(desc(subscribers.createdAt)).limit(2000),
  ]);
  return { messages, subscribers: subs };
}

export async function adminMedia() {
  const db = await adminDb();
  return db.select().from(media).orderBy(desc(media.createdAt)).limit(300);
}
