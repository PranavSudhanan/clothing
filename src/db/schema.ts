import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import type {
  Address,
  ColorOption,
  MeasurementProfile,
  Section,
  StyleOption,
  StyleSelections,
  TimelineEntry,
} from "@/lib/types";

const money = (name: string) => numeric(name, { precision: 12, scale: 2, mode: "number" });
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () => timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull().default(""),
  passwordHash: text("password_hash").notNull(),
  role: text("role").$type<"admin" | "customer">().notNull().default("customer"),
  addresses: jsonb("addresses").$type<Address[]>().notNull().default([]),
  measurements: jsonb("measurements").$type<MeasurementProfile[]>().notNull().default([]),
  createdAt: createdAt(),
});

/** Key/value store for site-wide configuration: general, commerce, seo, theme, navigation. */
export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").$type<Record<string, unknown>>().notNull(),
  updatedAt: updatedAt(),
});

/** Pages are built from an ordered list of sections. `home` and `couture` are system pages. */
export const pages = pgTable("pages", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  sections: jsonb("sections").$type<Section[]>().notNull().default([]),
  seoTitle: text("seo_title").notNull().default(""),
  seoDescription: text("seo_description").notNull().default(""),
  published: boolean("published").notNull().default(true),
  system: boolean("system").notNull().default(false),
  updatedAt: updatedAt(),
});

export const banners = pgTable("banners", {
  id: uuid("id").primaryKey().defaultRandom(),
  placement: text("placement").notNull().default("home-hero"),
  eyebrow: text("eyebrow").notNull().default(""),
  title: text("title").notNull(),
  subtitle: text("subtitle").notNull().default(""),
  image: text("image").notNull().default(""),
  mobileImage: text("mobile_image").notNull().default(""),
  ctaLabel: text("cta_label").notNull().default(""),
  ctaHref: text("cta_href").notNull().default(""),
  cta2Label: text("cta2_label").notNull().default(""),
  cta2Href: text("cta2_href").notNull().default(""),
  align: text("align").$type<"left" | "center" | "right">().notNull().default("left"),
  overlay: integer("overlay").notNull().default(35),
  active: boolean("active").notNull().default(true),
  sort: integer("sort").notNull().default(0),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
});

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull().default(""),
  image: text("image").notNull().default(""),
  sort: integer("sort").notNull().default(0),
  active: boolean("active").notNull().default(true),
});

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description").notNull().default(""),
    categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
    price: money("price").notNull(),
    compareAtPrice: money("compare_at_price"),
    images: jsonb("images").$type<string[]>().notNull().default([]),
    sizes: jsonb("sizes").$type<string[]>().notNull().default([]),
    colors: jsonb("colors").$type<ColorOption[]>().notNull().default([]),
    tags: jsonb("tags").$type<string[]>().notNull().default([]),
    fabric: text("fabric").notNull().default(""),
    fit: text("fit").notNull().default(""),
    care: text("care").notNull().default(""),
    featured: boolean("featured").notNull().default(false),
    isNew: boolean("is_new").notNull().default(false),
    status: text("status").$type<"active" | "draft">().notNull().default("active"),
    seoTitle: text("seo_title").notNull().default(""),
    seoDescription: text("seo_description").notNull().default(""),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("products_category_idx").on(t.categoryId), index("products_status_idx").on(t.status)],
);

export const productVariants = pgTable(
  "product_variants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    size: text("size").notNull().default(""),
    color: text("color").notNull().default(""),
    sku: text("sku").notNull().default(""),
    stock: integer("stock").notNull().default(0),
  },
  (t) => [index("variants_product_idx").on(t.productId)],
);

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    number: text("number").notNull().unique(),
    /** Unguessable id used in customer-facing order links. */
    token: text("token").notNull().unique(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull().default(""),
    shippingAddress: jsonb("shipping_address").$type<Address>().notNull(),
    subtotal: money("subtotal").notNull(),
    discount: money("discount").notNull().default(0),
    couponCode: text("coupon_code").notNull().default(""),
    shipping: money("shipping").notNull().default(0),
    tax: money("tax").notNull().default(0),
    total: money("total").notNull(),
    paymentMethod: text("payment_method").$type<"cod" | "online">().notNull().default("cod"),
    paymentStatus: text("payment_status").$type<"unpaid" | "paid" | "refunded">().notNull().default("unpaid"),
    gatewayOrderId: text("gateway_order_id").notNull().default(""),
    gatewayPaymentId: text("gateway_payment_id").notNull().default(""),
    status: text("status").notNull().default("pending"),
    trackingNumber: text("tracking_number").notNull().default(""),
    trackingUrl: text("tracking_url").notNull().default(""),
    notes: text("notes").notNull().default(""),
    adminNotes: text("admin_notes").notNull().default(""),
    timeline: jsonb("timeline").$type<TimelineEntry[]>().notNull().default([]),
    createdAt: createdAt(),
  },
  (t) => [index("orders_user_idx").on(t.userId), index("orders_created_idx").on(t.createdAt)],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: uuid("product_id"),
    variantId: uuid("variant_id"),
    name: text("name").notNull(),
    slug: text("slug").notNull().default(""),
    image: text("image").notNull().default(""),
    size: text("size").notNull().default(""),
    color: text("color").notNull().default(""),
    price: money("price").notNull(),
    qty: integer("qty").notNull(),
  },
  (t) => [index("order_items_order_idx").on(t.orderId)],
);

export const coupons = pgTable("coupons", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  description: text("description").notNull().default(""),
  type: text("type").$type<"percent" | "fixed">().notNull().default("percent"),
  value: money("value").notNull(),
  minOrder: money("min_order").notNull().default(0),
  maxDiscount: money("max_discount").notNull().default(0),
  usageLimit: integer("usage_limit").notNull().default(0),
  usedCount: integer("used_count").notNull().default(0),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  active: boolean("active").notNull().default(true),
});

export const fabrics = pgTable("fabrics", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  material: text("material").notNull().default(""),
  description: text("description").notNull().default(""),
  hex: text("hex").notNull().default("#444444"),
  image: text("image").notNull().default(""),
  priceDelta: money("price_delta").notNull().default(0),
  active: boolean("active").notNull().default(true),
  sort: integer("sort").notNull().default(0),
});

export const coutureServices = pgTable("couture_services", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  tagline: text("tagline").notNull().default(""),
  description: text("description").notNull().default(""),
  image: text("image").notNull().default(""),
  gallery: jsonb("gallery").$type<string[]>().notNull().default([]),
  basePrice: money("base_price").notNull(),
  leadTimeDays: integer("lead_time_days").notNull().default(14),
  measurementFields: jsonb("measurement_fields").$type<string[]>().notNull().default([]),
  styleOptions: jsonb("style_options").$type<StyleOption[]>().notNull().default([]),
  /** Empty = every active fabric is offered. */
  fabricIds: jsonb("fabric_ids").$type<string[]>().notNull().default([]),
  active: boolean("active").notNull().default(true),
  sort: integer("sort").notNull().default(0),
});

export const coutureOrders = pgTable(
  "couture_orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    number: text("number").notNull().unique(),
    token: text("token").notNull().unique(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    serviceId: uuid("service_id"),
    serviceName: text("service_name").notNull(),
    fabricId: uuid("fabric_id"),
    fabricName: text("fabric_name").notNull().default(""),
    styleSelections: jsonb("style_selections").$type<StyleSelections>().notNull().default({}),
    measurementMethod: text("measurement_method").notNull().default("self"),
    measurementUnit: text("measurement_unit").notNull().default("in"),
    measurements: jsonb("measurements").$type<Record<string, number>>().notNull().default({}),
    appointmentDate: text("appointment_date").notNull().default(""),
    appointmentSlot: text("appointment_slot").notNull().default(""),
    address: text("address").notNull().default(""),
    notes: text("notes").notNull().default(""),
    estimatedPrice: money("estimated_price").notNull().default(0),
    finalPrice: money("final_price"),
    advancePaid: money("advance_paid").notNull().default(0),
    status: text("status").notNull().default("requested"),
    adminNotes: text("admin_notes").notNull().default(""),
    timeline: jsonb("timeline").$type<TimelineEntry[]>().notNull().default([]),
    createdAt: createdAt(),
  },
  (t) => [index("couture_orders_user_idx").on(t.userId)],
);

export const subscribers = pgTable("subscribers", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  createdAt: createdAt(),
});

export const enquiries = pgTable("enquiries", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull().default(""),
  subject: text("subject").notNull().default(""),
  message: text("message").notNull(),
  status: text("status").$type<"new" | "read" | "closed">().notNull().default("new"),
  createdAt: createdAt(),
});

export const media = pgTable("media", {
  id: uuid("id").primaryKey().defaultRandom(),
  url: text("url").notNull(),
  name: text("name").notNull().default(""),
  size: integer("size").notNull().default(0),
  createdAt: createdAt(),
});

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
  variants: many(productVariants),
}));

export const productVariantsRelations = relations(productVariants, ({ one }) => ({
  product: one(products, { fields: [productVariants.productId], references: [products.id] }),
}));

export const ordersRelations = relations(orders, ({ many, one }) => ({
  items: many(orderItems),
  user: one(users, { fields: [orders.userId], references: [users.id] }),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
}));

export type User = typeof users.$inferSelect;
export type Page = typeof pages.$inferSelect;
export type Banner = typeof banners.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Product = typeof products.$inferSelect;
export type ProductVariant = typeof productVariants.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type Coupon = typeof coupons.$inferSelect;
export type Fabric = typeof fabrics.$inferSelect;
export type CoutureService = typeof coutureServices.$inferSelect;
export type CoutureOrder = typeof coutureOrders.$inferSelect;
export type Enquiry = typeof enquiries.$inferSelect;
export type Media = typeof media.$inferSelect;
