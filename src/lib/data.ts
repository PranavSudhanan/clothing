// Cached, public read models for the storefront.
// Everything here is safe to prerender; admin mutations expire the matching tag (see TAGS).

import { and, asc, desc, eq, gt, gte, ilike, inArray, isNotNull, lte, ne, or, sql, type SQL } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { getDb, schema, usingEmbeddedDb } from "@/db";
import { DEFAULT_CONFIG, mergeConfig } from "./defaults";
import type { ColorOption, SiteConfig } from "./types";

export const TAGS = {
  site: "site",
  pages: "pages",
  banners: "banners",
  catalog: "catalog",
  couture: "couture",
} as const;

const { banners, categories, coutureServices, fabrics, pages, products, settings } = schema;

/**
 * Slugs for generateStaticParams. Next.js needs at least one entry per dynamic route, so an
 * empty table falls back to a placeholder. The embedded development database can only be opened
 * by one process, and Next.js computes static params in a separate one — so it is skipped there
 * and pages are simply rendered on first visit instead.
 */
export async function staticSlugs(load: () => Promise<{ slug: string }[]>, placeholder: string) {
  if (usingEmbeddedDb()) return [{ slug: placeholder }];
  const rows = await load();
  return rows.length > 0 ? rows.map((row) => ({ slug: row.slug })) : [{ slug: placeholder }];
}

export async function getSiteConfig(): Promise<SiteConfig> {
  "use cache";
  cacheTag(TAGS.site);
  cacheLife("hours");

  const db = await getDb();
  const rows = await db.select().from(settings);
  const stored = Object.fromEntries(rows.filter((row) => !row.key.startsWith("_")).map((row) => [row.key, row.value]));
  return mergeConfig(DEFAULT_CONFIG, stored);
}

export async function getPage(slug: string) {
  "use cache";
  cacheTag(TAGS.pages);
  cacheLife("hours");

  const db = await getDb();
  const [page] = await db
    .select()
    .from(pages)
    .where(and(eq(pages.slug, slug), eq(pages.published, true)))
    .limit(1);
  return page ?? null;
}

export async function getPageSlugs() {
  "use cache";
  cacheTag(TAGS.pages);
  cacheLife("hours");

  const db = await getDb();
  const rows = await db
    .select({ slug: pages.slug, updatedAt: pages.updatedAt })
    .from(pages)
    .where(and(eq(pages.published, true), eq(pages.system, false)));
  return rows;
}

export async function getBanners(placement: string) {
  "use cache";
  cacheTag(TAGS.banners);
  cacheLife("hours");

  const db = await getDb();
  const now = new Date();
  const rows = await db
    .select()
    .from(banners)
    .where(and(eq(banners.placement, placement), eq(banners.active, true)))
    .orderBy(asc(banners.sort));
  return rows.filter((b) => (!b.startsAt || b.startsAt <= now) && (!b.endsAt || b.endsAt >= now));
}

export async function getCategories() {
  "use cache";
  cacheTag(TAGS.catalog);
  cacheLife("hours");

  const db = await getDb();
  return db.select().from(categories).where(eq(categories.active, true)).orderBy(asc(categories.sort), asc(categories.name));
}

export async function getCategory(slug: string) {
  "use cache";
  cacheTag(TAGS.catalog);
  cacheLife("hours");

  const db = await getDb();
  const [row] = await db
    .select()
    .from(categories)
    .where(and(eq(categories.slug, slug), eq(categories.active, true)))
    .limit(1);
  return row ?? null;
}

export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  images: string[];
  colors: ColorOption[];
  sizes: string[];
  isNew: boolean;
  categoryName: string;
  inStock: boolean;
  variants: { id: string; size: string; color: string; stock: number }[];
};

export type ProductQuery = {
  category?: string;
  q?: string;
  sizes?: string[];
  colors?: string[];
  min?: number;
  max?: number;
  source?: "featured" | "new" | "sale" | "all";
  ids?: string[];
  sort?: "featured" | "newest" | "price-asc" | "price-desc" | "name";
  page?: number;
  perPage?: number;
};

type ProductRow = typeof products.$inferSelect & {
  variants: (typeof schema.productVariants.$inferSelect)[];
  category: typeof categories.$inferSelect | null;
};

function toCard(p: ProductRow): ProductCardData {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    images: p.images,
    colors: p.colors,
    sizes: p.sizes,
    isNew: p.isNew,
    categoryName: p.category?.name ?? "",
    inStock: p.variants.some((v) => v.stock > 0),
    variants: p.variants.map((v) => ({ id: v.id, size: v.size, color: v.color, stock: v.stock })),
  };
}

export async function getProducts(query: ProductQuery): Promise<{ items: ProductCardData[]; total: number }> {
  "use cache";
  cacheTag(TAGS.catalog);
  cacheLife("hours");

  const db = await getDb();
  const where: (SQL | undefined)[] = [eq(products.status, "active")];

  if (query.category) {
    const [category] = await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, query.category));
    if (!category) return { items: [], total: 0 };
    where.push(eq(products.categoryId, category.id));
  }
  if (query.ids) {
    if (query.ids.length === 0) return { items: [], total: 0 };
    where.push(inArray(products.id, query.ids));
  }
  if (query.source === "featured") where.push(eq(products.featured, true));
  if (query.source === "new") where.push(eq(products.isNew, true));
  if (query.source === "sale") where.push(and(isNotNull(products.compareAtPrice), gt(products.compareAtPrice, products.price)));
  if (query.q?.trim()) {
    const term = `%${query.q.trim().replace(/[%_]/g, "")}%`;
    where.push(
      or(
        ilike(products.name, term),
        ilike(products.description, term),
        ilike(products.fabric, term),
        sql`${products.tags}::text ilike ${term}`,
      ),
    );
  }
  if (query.sizes?.length) {
    where.push(or(...query.sizes.map((size) => sql`${products.sizes} @> ${JSON.stringify([size])}::jsonb`)));
  }
  if (query.colors?.length) {
    where.push(or(...query.colors.map((name) => sql`${products.colors} @> ${JSON.stringify([{ name }])}::jsonb`)));
  }
  if (typeof query.min === "number") where.push(gte(products.price, query.min));
  if (typeof query.max === "number") where.push(lte(products.price, query.max));

  const orderBy = {
    featured: [desc(products.featured), desc(products.createdAt)],
    newest: [desc(products.createdAt)],
    "price-asc": [asc(products.price)],
    "price-desc": [desc(products.price)],
    name: [asc(products.name)],
  }[query.sort ?? "featured"];

  const perPage = Math.min(Math.max(query.perPage ?? 12, 1), 48);
  const page = Math.max(query.page ?? 1, 1);
  const filter = and(...where);

  const rows = await db.query.products.findMany({
    where: filter,
    with: { variants: true, category: true },
    orderBy,
    limit: perPage,
    offset: (page - 1) * perPage,
  });
  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(products).where(filter);

  let items = rows.map(toCard);
  if (query.ids) {
    const order = new Map(query.ids.map((id, i) => [id, i]));
    items = items.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  }
  return { items, total: count };
}

export type Facets = { sizes: string[]; colors: ColorOption[]; minPrice: number; maxPrice: number };

/** Filter options available within a category (or the whole catalogue). */
export async function getFacets(categorySlug?: string): Promise<Facets> {
  "use cache";
  cacheTag(TAGS.catalog);
  cacheLife("hours");

  const db = await getDb();
  const where: (SQL | undefined)[] = [eq(products.status, "active")];
  if (categorySlug) {
    const [category] = await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, categorySlug));
    if (category) where.push(eq(products.categoryId, category.id));
  }
  const rows = await db
    .select({ sizes: products.sizes, colors: products.colors, price: products.price })
    .from(products)
    .where(and(...where));

  const sizes = new Set<string>();
  const colors = new Map<string, ColorOption>();
  let minPrice = Infinity;
  let maxPrice = 0;
  for (const row of rows) {
    row.sizes.forEach((size) => sizes.add(size));
    row.colors.forEach((color) => colors.set(color.name, color));
    minPrice = Math.min(minPrice, row.price);
    maxPrice = Math.max(maxPrice, row.price);
  }
  const numeric = (v: string) => (/^\d+$/.test(v) ? Number(v) : NaN);
  const alpha = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL"];
  const sortedSizes = [...sizes].sort((a, b) => {
    const [na, nb] = [numeric(a), numeric(b)];
    if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
    if (Number.isNaN(na) !== Number.isNaN(nb)) return Number.isNaN(na) ? -1 : 1;
    return (alpha.indexOf(a) + 100) % 100 - ((alpha.indexOf(b) + 100) % 100);
  });

  return {
    sizes: sortedSizes,
    colors: [...colors.values()].sort((a, b) => a.name.localeCompare(b.name)),
    minPrice: Number.isFinite(minPrice) ? Math.floor(minPrice) : 0,
    maxPrice: Math.ceil(maxPrice),
  };
}

export async function getProductBySlug(slug: string) {
  "use cache";
  cacheTag(TAGS.catalog);
  cacheLife("hours");

  const db = await getDb();
  const product = await db.query.products.findFirst({
    where: and(eq(products.slug, slug), eq(products.status, "active")),
    with: { variants: true, category: true },
  });
  if (!product) return null;

  const related = product.categoryId
    ? await db.query.products.findMany({
        where: and(eq(products.status, "active"), eq(products.categoryId, product.categoryId), ne(products.id, product.id)),
        with: { variants: true, category: true },
        orderBy: [desc(products.featured), desc(products.createdAt)],
        limit: 4,
      })
    : [];

  return { product, related: related.map(toCard) };
}

export async function getProductSlugs() {
  "use cache";
  cacheTag(TAGS.catalog);
  cacheLife("hours");

  const db = await getDb();
  return db
    .select({ slug: products.slug, updatedAt: products.updatedAt })
    .from(products)
    .where(eq(products.status, "active"));
}

export async function getFabrics() {
  "use cache";
  cacheTag(TAGS.couture);
  cacheLife("hours");

  const db = await getDb();
  return db.select().from(fabrics).where(eq(fabrics.active, true)).orderBy(asc(fabrics.sort), asc(fabrics.name));
}

export async function getCoutureServices() {
  "use cache";
  cacheTag(TAGS.couture);
  cacheLife("hours");

  const db = await getDb();
  return db
    .select()
    .from(coutureServices)
    .where(eq(coutureServices.active, true))
    .orderBy(asc(coutureServices.sort), asc(coutureServices.name));
}

export async function getCoutureService(slug: string) {
  "use cache";
  cacheTag(TAGS.couture);
  cacheLife("hours");

  const db = await getDb();
  const [service] = await db
    .select()
    .from(coutureServices)
    .where(and(eq(coutureServices.slug, slug), eq(coutureServices.active, true)))
    .limit(1);
  if (!service) return null;

  const allFabrics = await db.select().from(fabrics).where(eq(fabrics.active, true)).orderBy(asc(fabrics.sort));
  const offered = service.fabricIds.length ? allFabrics.filter((f) => service.fabricIds.includes(f.id)) : allFabrics;
  return { service, fabrics: offered };
}
