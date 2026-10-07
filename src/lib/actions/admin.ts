"use server";

import { unlink } from "node:fs/promises";
import path from "node:path";
import { del } from "@vercel/blob";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { updateTag } from "next/cache";
import { after } from "next/server";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { assertAdmin } from "@/lib/auth";
import { TAGS } from "@/lib/data";
import { DEFAULT_CONFIG } from "@/lib/defaults";
import { notifyOrderUpdate } from "@/lib/notify";
import { SECTION_DEFINITIONS } from "@/lib/sections";
import { COUTURE_STATUSES, MEASUREMENT_FIELDS, ORDER_STATUSES, PAYMENT_STATUSES, type Section, type SettingKey } from "@/lib/types";
import { siteUrl } from "@/lib/site-url";
import { slugify } from "@/lib/utils";

const { banners, categories, coupons, coutureOrders, coutureServices, enquiries, fabrics, media, orders, pages, productVariants, products, settings, subscribers } =
  schema;

export type AdminResult<T = undefined> = { ok: true; message: string; data?: T } | { ok: false; message: string };

const text = (max: number) => z.string().trim().max(max).default("");
const required = (max: number, label: string) => z.string().trim().min(1, `${label} is required`).max(max);
const url = z.string().trim().max(2000).default("");
const bool = z.boolean().default(false);
const int = z.coerce.number().int();
const money = z.coerce.number().min(0, "Amounts cannot be negative").max(100_000_000);
const optionalDate = z.preprocess((v) => (v ? new Date(String(v)) : null), z.date().nullable());
const hex = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{3,8}$/, "Use a hex colour like #1b1916");

function issue(error: z.ZodError) {
  const first = error.issues[0];
  if (!first) return "Please check the form.";
  const where = first.path.length ? `${first.path.join(" › ")}: ` : "";
  return `${where}${first.message}`;
}

function isUniqueViolation(error: unknown) {
  const e = error as { code?: string; cause?: { code?: string } };
  return e?.code === "23505" || e?.cause?.code === "23505";
}

function fail(error: unknown, duplicate: string): AdminResult<never> {
  if (isUniqueViolation(error)) return { ok: false, message: duplicate };
  console.error("[admin]", error);
  return { ok: false, message: "Something went wrong while saving. Please try again." };
}

/* ─── Settings ─────────────────────────────────────────────────────────── */

export async function saveSettingAction(key: SettingKey, value: Record<string, unknown>): Promise<AdminResult> {
  await assertAdmin();
  if (!(key in DEFAULT_CONFIG) || typeof value !== "object" || value === null || Array.isArray(value)) {
    return { ok: false, message: "Unknown setting." };
  }
  if (JSON.stringify(value).length > 200_000) return { ok: false, message: "That is too much data to save." };

  const db = await getDb();
  const save = (name: SettingKey, next: Record<string, unknown>) =>
    db
      .insert(settings)
      .values({ key: name, value: next, updatedAt: new Date() })
      .onConflictDoUpdate({ target: settings.key, set: { value: next, updatedAt: new Date() } });

  let renamed = false;
  if (key === "general") {
    const name = typeof value.storeName === "string" ? value.storeName.trim() : "";
    if (!name) return { ok: false, message: "Enter a store name." };
    value = { ...value, storeName: name };

    // The home page's search title and description are stored separately (Settings → SEO).
    // When the store is renamed, carry the new name into them so the old one does not linger.
    const rows = await db.select().from(settings).where(inArray(settings.key, ["general", "seo"]));
    const stored = (wanted: string) => (rows.find((row) => row.key === wanted)?.value ?? {}) as Record<string, unknown>;
    const previous = typeof stored("general").storeName === "string" ? String(stored("general").storeName) : DEFAULT_CONFIG.general.storeName;
    if (previous !== name && previous.length >= 3) {
      renamed = true;
      const seo = { ...DEFAULT_CONFIG.seo, ...stored("seo") } as Record<string, unknown>;
      const swap = (text: unknown) => (typeof text === "string" ? text.split(previous).join(name) : text);
      await save("seo", { ...seo, title: swap(seo.title), description: swap(seo.description) });
    }
  }

  await save(key, value);

  updateTag(TAGS.site);
  return {
    ok: true,
    message: renamed
      ? "Saved. The new store name now shows across the storefront, the admin panel, emails and the search title."
      : "Saved. Your storefront is updated.",
  };
}

/* ─── Simple resources (banners, categories, coupons, fabrics, services) ─ */

const styleOption = z.object({
  name: required(80, "Option name"),
  choices: z
    .array(z.object({ label: required(120, "Choice label"), priceDelta: z.coerce.number().min(-1_000_000).max(1_000_000).default(0) }))
    .min(1, "Each style option needs at least one choice")
    .max(20),
});

const resourceSchemas = {
  banners: z.object({
    placement: required(60, "Banner group").transform((v) => slugify(v)),
    eyebrow: text(120),
    title: required(160, "Title"),
    subtitle: text(400),
    image: url,
    mobileImage: url,
    ctaLabel: text(60),
    ctaHref: url,
    cta2Label: text(60),
    cta2Href: url,
    align: z.enum(["left", "center", "right"]).default("left"),
    overlay: int.min(0).max(90).default(35),
    active: bool,
    sort: int.default(0),
    startsAt: optionalDate,
    endsAt: optionalDate,
  }),
  categories: z.object({
    name: required(80, "Name"),
    slug: text(80),
    description: text(600),
    image: url,
    sort: int.default(0),
    active: bool,
  }),
  coupons: z.object({
    code: required(40, "Code").transform((v) => v.toUpperCase().replace(/\s+/g, "")),
    description: text(200),
    type: z.enum(["percent", "fixed"]),
    value: money,
    minOrder: money.default(0),
    maxDiscount: money.default(0),
    usageLimit: int.min(0).default(0),
    startsAt: optionalDate,
    endsAt: optionalDate,
    active: bool,
  }),
  fabrics: z.object({
    name: required(120, "Name"),
    material: text(120),
    description: text(600),
    hex,
    image: url,
    priceDelta: z.coerce.number().min(-1_000_000).max(1_000_000).default(0),
    active: bool,
    sort: int.default(0),
  }),
  services: z.object({
    name: required(120, "Name"),
    slug: text(80),
    tagline: text(200),
    description: text(6000),
    image: url,
    gallery: z.array(url).max(12).default([]),
    basePrice: money,
    leadTimeDays: int.min(1).max(365).default(14),
    measurementFields: z.array(z.string().refine((key) => key in MEASUREMENT_FIELDS, "Unknown measurement")).default([]),
    styleOptions: z.array(styleOption).max(20).default([]),
    fabricIds: z.array(z.uuid()).default([]),
    active: bool,
    sort: int.default(0),
  }),
};

export type ResourceKey = keyof typeof resourceSchemas;

const resourceTables = {
  banners: { table: banners, tag: TAGS.banners },
  categories: { table: categories, tag: TAGS.catalog },
  coupons: { table: coupons, tag: null },
  fabrics: { table: fabrics, tag: TAGS.couture },
  services: { table: coutureServices, tag: TAGS.couture },
} as const;

export async function saveResourceAction(resource: ResourceKey, input: Record<string, unknown>): Promise<AdminResult> {
  await assertAdmin();
  const definition = resourceSchemas[resource];
  if (!definition) return { ok: false, message: "Unknown resource." };

  const parsed = definition.safeParse(input);
  if (!parsed.success) return { ok: false, message: issue(parsed.error) };
  const values = parsed.data as Record<string, unknown>;

  if ("slug" in values) {
    values.slug = slugify(String(values.slug || values.name));
    if (!values.slug) return { ok: false, message: "Enter a name or slug." };
  }
  if (resource === "coupons" && values.type === "percent" && Number(values.value) > 100) {
    return { ok: false, message: "A percentage discount cannot be more than 100." };
  }

  const id = typeof input.id === "string" && z.uuid().safeParse(input.id).success ? input.id : null;
  const { table, tag } = resourceTables[resource];
  const db = await getDb();

  try {
    if (id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await db.update(table).set(values as any).where(eq(table.id, id));
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await db.insert(table).values(values as any);
    }
  } catch (error) {
    return fail(error, resource === "coupons" ? "A coupon with this code already exists." : "That URL slug is already in use — choose another.");
  }

  if (tag) updateTag(tag);
  return { ok: true, message: "Saved." };
}

export async function deleteResourceAction(resource: ResourceKey, id: string): Promise<AdminResult> {
  await assertAdmin();
  const entry = resourceTables[resource];
  if (!entry || !z.uuid().safeParse(id).success) return { ok: false, message: "Unknown item." };
  const db = await getDb();
  await db.delete(entry.table).where(eq(entry.table.id, id));
  if (entry.tag) updateTag(entry.tag);
  return { ok: true, message: "Deleted." };
}

/* ─── Products ─────────────────────────────────────────────────────────── */

const productSchema = z.object({
  id: z.uuid().optional(),
  name: required(160, "Name"),
  slug: text(80),
  description: text(8000),
  categoryId: z.preprocess((v) => v || null, z.uuid().nullable()),
  price: money,
  compareAtPrice: z.preprocess((v) => (v === "" || v === null || v === undefined || Number(v) === 0 ? null : v), money.nullable()),
  images: z.array(z.string().trim().min(1).max(2000)).max(12).default([]),
  sizes: z.array(z.string().trim().min(1).max(20)).max(20).default([]),
  colors: z.array(z.object({ name: required(40, "Colour name"), hex })).max(12).default([]),
  tags: z.array(z.string().trim().min(1).max(40)).max(30).default([]),
  fabric: text(200),
  fit: text(200),
  care: text(600),
  featured: bool,
  isNew: bool,
  status: z.enum(["active", "draft"]),
  seoTitle: text(160),
  seoDescription: text(320),
  variants: z
    .array(z.object({ size: z.string().max(20), color: z.string().max(40), sku: text(60), stock: int.min(0).max(100000) }))
    .max(300)
    .default([]),
});

export async function saveProductAction(input: Record<string, unknown>): Promise<AdminResult<{ id: string }>> {
  await assertAdmin();
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: issue(parsed.error) };
  const { id, variants, ...data } = parsed.data;

  const slug = slugify(data.slug || data.name);
  if (!slug) return { ok: false, message: "Enter a product name." };
  const sizes = [...new Set(data.sizes)];
  const colorNames = new Set<string>();
  const colors = data.colors.filter((c) => (colorNames.has(c.name) ? false : (colorNames.add(c.name), true)));
  if (data.compareAtPrice !== null && data.compareAtPrice <= data.price) {
    return { ok: false, message: "The compare-at price must be higher than the price (or left empty)." };
  }

  const db = await getDb();
  try {
    const productId = await db.transaction(async (tx) => {
      const values = { ...data, slug, sizes, colors, updatedAt: new Date() };
      let pid = id;
      if (pid) {
        await tx.update(products).set(values).where(eq(products.id, pid));
      } else {
        [{ id: pid }] = await tx.insert(products).values(values).returning({ id: products.id });
      }

      // One variant per size × colour. Existing rows keep their id so past orders still link up.
      const combos = (sizes.length ? sizes : [""]).flatMap((size) =>
        (colors.length ? colors.map((c) => c.name) : [""]).map((color) => ({ size, color })),
      );
      const existing = await tx.select().from(productVariants).where(eq(productVariants.productId, pid!));
      const keep: string[] = [];
      for (const combo of combos) {
        const incoming = variants.find((v) => v.size === combo.size && v.color === combo.color);
        const current = existing.find((v) => v.size === combo.size && v.color === combo.color);
        const row = { sku: incoming?.sku ?? current?.sku ?? "", stock: incoming?.stock ?? current?.stock ?? 0 };
        if (current) {
          keep.push(current.id);
          await tx.update(productVariants).set(row).where(eq(productVariants.id, current.id));
        } else {
          const [created] = await tx
            .insert(productVariants)
            .values({ productId: pid!, ...combo, ...row })
            .returning({ id: productVariants.id });
          keep.push(created.id);
        }
      }
      const stale = existing.filter((v) => !keep.includes(v.id)).map((v) => v.id);
      if (stale.length) await tx.delete(productVariants).where(inArray(productVariants.id, stale));
      return pid!;
    });

    updateTag(TAGS.catalog);
    return { ok: true, message: "Product saved.", data: { id: productId } };
  } catch (error) {
    return fail(error, "Another product already uses this URL slug.");
  }
}

export async function deleteProductAction(id: string): Promise<AdminResult> {
  await assertAdmin();
  if (!z.uuid().safeParse(id).success) return { ok: false, message: "Unknown product." };
  const db = await getDb();
  await db.delete(products).where(eq(products.id, id));
  updateTag(TAGS.catalog);
  return { ok: true, message: "Product deleted." };
}

/* ─── Pages ────────────────────────────────────────────────────────────── */

const RESERVED = new Set([
  "home", "shop", "product", "collections", "cart", "checkout", "order", "track", "wishlist",
  "couture", "account", "login", "register", "admin", "api", "uploads", "sitemap.xml", "robots.txt",
]);
const SECTION_TYPES = new Set(SECTION_DEFINITIONS.map((d) => d.type));

const pageSchema = z.object({
  id: z.uuid().optional(),
  title: required(120, "Title"),
  slug: text(80),
  seoTitle: text(160),
  seoDescription: text(320),
  published: bool,
  sections: z
    .array(
      z.object({
        id: z.string().min(1).max(60),
        type: z.string().refine((t) => SECTION_TYPES.has(t), "Unknown section type"),
        enabled: z.boolean(),
        data: z.record(z.string(), z.unknown()),
      }),
    )
    .max(40, "A page can have up to 40 sections"),
});

export async function savePageAction(input: Record<string, unknown>): Promise<AdminResult<{ id: string }>> {
  await assertAdmin();
  const parsed = pageSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: issue(parsed.error) };
  const { id, ...data } = parsed.data;
  if (JSON.stringify(data.sections).length > 400_000) return { ok: false, message: "This page is too large to save." };

  const db = await getDb();
  const sections = data.sections as Section[];

  try {
    if (id) {
      const [current] = await db.select().from(pages).where(eq(pages.id, id)).limit(1);
      if (!current) return { ok: false, message: "Page not found." };
      // System pages keep their address and are always live.
      const slug = current.system ? current.slug : slugify(data.slug || data.title);
      if (!current.system && (!slug || RESERVED.has(slug))) return { ok: false, message: "That URL is reserved. Choose another slug." };
      await db
        .update(pages)
        .set({ ...data, sections, slug, published: current.system ? true : data.published, updatedAt: new Date() })
        .where(eq(pages.id, id));
      updateTag(TAGS.pages);
      return { ok: true, message: "Page saved.", data: { id } };
    }

    const slug = slugify(data.slug || data.title);
    if (!slug || RESERVED.has(slug)) return { ok: false, message: "That URL is reserved. Choose another slug." };
    const [created] = await db.insert(pages).values({ ...data, sections, slug, system: false }).returning({ id: pages.id });
    updateTag(TAGS.pages);
    return { ok: true, message: "Page created.", data: { id: created.id } };
  } catch (error) {
    return fail(error, "Another page already uses this URL slug.");
  }
}

export async function deletePageAction(id: string): Promise<AdminResult> {
  await assertAdmin();
  if (!z.uuid().safeParse(id).success) return { ok: false, message: "Unknown page." };
  const db = await getDb();
  const deleted = await db.delete(pages).where(and(eq(pages.id, id), eq(pages.system, false))).returning({ id: pages.id });
  if (deleted.length === 0) return { ok: false, message: "System pages cannot be deleted." };
  updateTag(TAGS.pages);
  return { ok: true, message: "Page deleted." };
}

/* ─── Orders ───────────────────────────────────────────────────────────── */

const orderPatch = z.object({
  status: z.enum(ORDER_STATUSES),
  paymentStatus: z.enum(PAYMENT_STATUSES),
  trackingNumber: text(80),
  trackingUrl: url,
  adminNotes: text(4000),
});

const CLOSED = ["cancelled", "returned"];

/** `notify` sends the customer an email and text message when the order ships, is delivered or is cancelled. */
export async function updateOrderAction(id: string, input: z.input<typeof orderPatch>, notify = true): Promise<AdminResult> {
  await assertAdmin();
  const parsed = orderPatch.safeParse(input);
  if (!parsed.success || !z.uuid().safeParse(id).success) return { ok: false, message: "Please check the form." };
  const patch = parsed.data;

  const db = await getDb();
  const order = await db.query.orders.findFirst({ where: eq(orders.id, id), with: { items: true } });
  if (!order) return { ok: false, message: "Order not found." };

  const timeline = [...order.timeline];
  const at = new Date().toISOString();
  if (patch.status !== order.status) timeline.push({ at, status: patch.status, note: `Status changed to ${patch.status}` });
  if (patch.paymentStatus !== order.paymentStatus) timeline.push({ at, status: order.status, note: `Payment marked ${patch.paymentStatus}` });

  // Put stock back the first time an order is cancelled or returned; take it again if it is reopened.
  const wasClosed = CLOSED.includes(order.status);
  const isClosed = CLOSED.includes(patch.status);

  await db.transaction(async (tx) => {
    if (wasClosed !== isClosed) {
      for (const item of order.items) {
        if (!item.variantId) continue;
        await tx
          .update(productVariants)
          .set({ stock: isClosed ? sql`${productVariants.stock} + ${item.qty}` : sql`greatest(${productVariants.stock} - ${item.qty}, 0)` })
          .where(eq(productVariants.id, item.variantId));
      }
    }
    await tx.update(orders).set({ ...patch, timeline }).where(eq(orders.id, id));
  });

  if (wasClosed !== isClosed) updateTag(TAGS.catalog);

  // Tell the customer about the milestones they care about. A tracking number added to an
  // order that already shipped counts as a shipping update too.
  const statusChanged = patch.status !== order.status;
  const kind =
    statusChanged && (patch.status === "shipped" || patch.status === "delivered" || patch.status === "cancelled")
      ? patch.status
      : patch.status === "shipped" && patch.trackingNumber && patch.trackingNumber !== order.trackingNumber
        ? "shipped"
        : null;
  if (notify && kind) {
    const base = await siteUrl();
    after(() => notifyOrderUpdate(id, kind, base));
    return { ok: true, message: "Order updated. The customer is being notified." };
  }
  return { ok: true, message: "Order updated." };
}

const couturePatch = z.object({
  status: z.enum(COUTURE_STATUSES),
  finalPrice: z.preprocess((v) => (v === "" || v === null || v === undefined ? null : v), money.nullable()),
  advancePaid: money.default(0),
  appointmentDate: text(20),
  appointmentSlot: text(40),
  adminNotes: text(4000),
});

export async function updateCoutureOrderAction(id: string, input: z.input<typeof couturePatch>): Promise<AdminResult> {
  await assertAdmin();
  const parsed = couturePatch.safeParse(input);
  if (!parsed.success || !z.uuid().safeParse(id).success) return { ok: false, message: parsed.success ? "Unknown order." : issue(parsed.error) };
  const patch = parsed.data;

  const db = await getDb();
  const [order] = await db.select().from(coutureOrders).where(eq(coutureOrders.id, id)).limit(1);
  if (!order) return { ok: false, message: "Order not found." };

  const timeline = [...order.timeline];
  if (patch.status !== order.status) {
    timeline.push({ at: new Date().toISOString(), status: patch.status, note: `Moved to ${patch.status}` });
  }
  await db.update(coutureOrders).set({ ...patch, timeline }).where(eq(coutureOrders.id, id));
  return { ok: true, message: "Couture order updated." };
}

/* ─── Inbox ────────────────────────────────────────────────────────────── */

export async function setEnquiryStatusAction(id: string, status: "new" | "read" | "closed"): Promise<AdminResult> {
  await assertAdmin();
  if (!z.uuid().safeParse(id).success || !["new", "read", "closed"].includes(status)) return { ok: false, message: "Unknown enquiry." };
  const db = await getDb();
  await db.update(enquiries).set({ status }).where(eq(enquiries.id, id));
  return { ok: true, message: "Updated." };
}

export async function deleteEnquiryAction(id: string): Promise<AdminResult> {
  await assertAdmin();
  if (!z.uuid().safeParse(id).success) return { ok: false, message: "Unknown enquiry." };
  const db = await getDb();
  await db.delete(enquiries).where(eq(enquiries.id, id));
  return { ok: true, message: "Deleted." };
}

export async function deleteSubscriberAction(id: string): Promise<AdminResult> {
  await assertAdmin();
  if (!z.uuid().safeParse(id).success) return { ok: false, message: "Unknown subscriber." };
  const db = await getDb();
  await db.delete(subscribers).where(eq(subscribers.id, id));
  return { ok: true, message: "Removed." };
}

/* ─── Media ────────────────────────────────────────────────────────────── */

export async function listMediaAction(): Promise<{ id: string; url: string; name: string }[]> {
  await assertAdmin();
  const db = await getDb();
  return db.select({ id: media.id, url: media.url, name: media.name }).from(media).orderBy(desc(media.createdAt)).limit(120);
}

export async function deleteMediaAction(id: string): Promise<AdminResult> {
  await assertAdmin();
  if (!z.uuid().safeParse(id).success) return { ok: false, message: "Unknown file." };
  const db = await getDb();
  const [file] = await db.delete(media).where(eq(media.id, id)).returning();
  if (!file) return { ok: false, message: "File not found." };

  // Best effort: remove the stored file too. The library entry is already gone either way.
  try {
    if (file.url.startsWith("/uploads/")) {
      await unlink(path.join(process.cwd(), ".data", "uploads", path.basename(file.url)));
    } else if (process.env.BLOB_READ_WRITE_TOKEN && file.url.includes(".blob.vercel-storage.com")) {
      await del(file.url);
    }
  } catch (error) {
    console.warn("[media] Could not remove stored file", error);
  }
  return { ok: true, message: "File deleted." };
}

/* ─── Bulk helpers ─────────────────────────────────────────────────────── */

export async function setProductFlagAction(id: string, flag: "featured" | "isNew", value: boolean): Promise<AdminResult> {
  await assertAdmin();
  if (!z.uuid().safeParse(id).success || !["featured", "isNew"].includes(flag)) return { ok: false, message: "Unknown product." };
  const db = await getDb();
  await db.update(products).set({ [flag]: Boolean(value) }).where(eq(products.id, id));
  updateTag(TAGS.catalog);
  return { ok: true, message: "Updated." };
}
