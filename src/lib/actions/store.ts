"use server";

import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { and, eq, gte, inArray, sql } from "drizzle-orm";
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb, schema, type DB } from "@/db";
import { createSession, destroySession, getCurrentUser } from "@/lib/auth";
import { getProducts, getSiteConfig, TAGS, type ProductCardData } from "@/lib/data";
import { computeTotals, type CouponRule } from "@/lib/pricing";
import { createRazorpayOrder, razorpayConfigured, razorpayKeyId, verifyPaymentSignature } from "@/lib/razorpay";
import type { Address, MeasurementProfile, TimelineEntry } from "@/lib/types";

const { coupons, coutureOrders, coutureServices, enquiries, fabrics, orderItems, orders, productVariants, subscribers, users } =
  schema;

export type ActionResult = { ok: boolean; message: string };

const email = z.preprocess(
  (value) => (typeof value === "string" ? value.trim().toLowerCase() : value),
  z.email("Enter a valid email address").max(200),
);
const phone = z
  .string()
  .trim()
  .min(7, "Enter a valid phone number")
  .max(20)
  .regex(/^[0-9+()\-\s]+$/, "Enter a valid phone number");
const text = (max: number) => z.string().trim().max(max);

const addressSchema = z.object({
  name: text(120).min(2, "Enter the recipient's name"),
  phone,
  line1: text(200).min(3, "Enter your address"),
  line2: text(200).optional().default(""),
  city: text(80).min(2, "Enter your city"),
  state: text(80).min(2, "Enter your state"),
  postalCode: text(12).min(3, "Enter your PIN code"),
  country: text(60).min(2).default("India"),
});

function firstIssue(error: z.ZodError) {
  return error.issues[0]?.message ?? "Please check the form and try again.";
}

function now() {
  return new Date().toISOString();
}

function orderNumber(prefix: string) {
  const d = new Date();
  const stamp = `${String(d.getUTCFullYear()).slice(2)}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;
  const clean = prefix.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 6) || "OR";
  return `${clean}-${stamp}-${crypto.randomInt(10000, 99999)}`;
}

const newToken = () => crypto.randomBytes(18).toString("base64url");

/* ─── Newsletter & enquiries ───────────────────────────────────────────── */

export async function subscribeAction(input: string): Promise<ActionResult> {
  const parsed = email.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Enter a valid email address." };
  const db = await getDb();
  await db.insert(subscribers).values({ email: parsed.data }).onConflictDoNothing();
  return { ok: true, message: "Thank you — you are on the list." };
}

const enquirySchema = z.object({
  name: text(120).min(2, "Enter your name"),
  email,
  phone: text(20).optional().default(""),
  subject: text(160).optional().default(""),
  message: text(4000).min(5, "Write a short message"),
});

export async function enquiryAction(input: z.input<typeof enquirySchema>): Promise<ActionResult> {
  const parsed = enquirySchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: firstIssue(parsed.error) };
  const db = await getDb();
  await db.insert(enquiries).values(parsed.data);
  return { ok: true, message: "Thank you. We have received your message and will reply shortly." };
}

/* ─── Coupons ──────────────────────────────────────────────────────────── */

async function lookupCoupon(db: DB, code: string, subtotal: number): Promise<{ rule: CouponRule } | { error: string }> {
  const normalised = code.trim().toUpperCase();
  if (!normalised) return { error: "Enter a coupon code." };
  const [coupon] = await db.select().from(coupons).where(eq(sql`upper(${coupons.code})`, normalised)).limit(1);
  const today = new Date();
  if (!coupon || !coupon.active) return { error: "That code is not valid." };
  if (coupon.startsAt && coupon.startsAt > today) return { error: "That code is not active yet." };
  if (coupon.endsAt && coupon.endsAt < today) return { error: "That code has expired." };
  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) return { error: "That code has been fully redeemed." };
  if (subtotal < coupon.minOrder) {
    return { error: `Add a little more to use this code — it needs a minimum order of ${coupon.minOrder}.` };
  }
  return {
    rule: {
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      minOrder: coupon.minOrder,
      maxDiscount: coupon.maxDiscount,
    },
  };
}

export async function validateCouponAction(
  code: string,
  subtotal: number,
): Promise<{ ok: true; coupon: CouponRule } | { ok: false; message: string }> {
  if (typeof code !== "string" || typeof subtotal !== "number") return { ok: false, message: "That code is not valid." };
  const db = await getDb();
  const result = await lookupCoupon(db, code.slice(0, 40), subtotal);
  if ("error" in result) return { ok: false, message: result.error };
  return { ok: true, coupon: result.rule };
}

/* ─── Checkout ─────────────────────────────────────────────────────────── */

const orderSchema = z.object({
  items: z
    .array(z.object({ variantId: z.uuid(), qty: z.number().int().min(1).max(20) }))
    .min(1, "Your bag is empty")
    .max(50),
  email,
  address: addressSchema,
  couponCode: text(40).optional().default(""),
  paymentMethod: z.enum(["cod", "online"]),
  notes: text(1000).optional().default(""),
});

export type PaymentRequest = {
  keyId: string;
  gatewayOrderId: string;
  amount: number;
  currency: string;
  name: string;
  email: string;
  phone: string;
  storeName: string;
};

export type PlaceOrderResult =
  | { ok: true; token: string; payment?: PaymentRequest }
  | { ok: false; message: string };

class CheckoutError extends Error {}

export async function placeOrderAction(input: z.input<typeof orderSchema>): Promise<PlaceOrderResult> {
  const parsed = orderSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: firstIssue(parsed.error) };
  const data = parsed.data;

  const [config, user, db] = await Promise.all([getSiteConfig(), getCurrentUser(), getDb()]);
  const { commerce, general } = config;

  if (data.paymentMethod === "cod" && !commerce.codEnabled) {
    return { ok: false, message: "Cash on delivery is not available right now." };
  }
  if (data.paymentMethod === "online" && !(commerce.onlineEnabled && razorpayConfigured())) {
    return { ok: false, message: "Online payment is not available right now." };
  }

  // Merge duplicate lines, then price everything from the database — never from the browser.
  const wanted = new Map<string, number>();
  for (const item of data.items) wanted.set(item.variantId, (wanted.get(item.variantId) ?? 0) + item.qty);

  const variants = await db.query.productVariants.findMany({
    where: inArray(productVariants.id, [...wanted.keys()]),
    with: { product: true },
  });

  const lines: {
    variantId: string;
    productId: string;
    name: string;
    slug: string;
    image: string;
    size: string;
    color: string;
    price: number;
    qty: number;
  }[] = [];

  for (const [variantId, qty] of wanted) {
    const variant = variants.find((v) => v.id === variantId);
    if (!variant || variant.product.status !== "active") {
      return { ok: false, message: "An item in your bag is no longer available. Please review your bag." };
    }
    if (variant.stock < qty) {
      const label = [variant.product.name, variant.color, variant.size].filter(Boolean).join(" · ");
      return {
        ok: false,
        message: variant.stock === 0 ? `${label} has just sold out.` : `Only ${variant.stock} left of ${label}.`,
      };
    }
    lines.push({
      variantId,
      productId: variant.productId,
      name: variant.product.name,
      slug: variant.product.slug,
      image: variant.product.images[0] ?? "",
      size: variant.size,
      color: variant.color,
      price: variant.product.price,
      qty,
    });
  }

  let coupon: CouponRule | null = null;
  if (data.couponCode) {
    const subtotal = lines.reduce((sum, l) => sum + l.price * l.qty, 0);
    const result = await lookupCoupon(db, data.couponCode, subtotal);
    if ("error" in result) return { ok: false, message: result.error };
    coupon = result.rule;
  }

  const totals = computeTotals(lines, commerce, coupon);
  const number = orderNumber(commerce.orderPrefix);
  const token = newToken();

  let gatewayOrderId = "";
  if (data.paymentMethod === "online") {
    try {
      gatewayOrderId = (await createRazorpayOrder(totals.total, commerce.currency, number)).id;
    } catch (error) {
      console.error("[checkout] Razorpay order failed", error);
      return { ok: false, message: "We could not start the online payment. Please try again or choose cash on delivery." };
    }
  }

  const timeline: TimelineEntry[] = [{ at: now(), status: "pending", note: "Order placed" }];

  try {
    await db.transaction(async (tx) => {
      for (const line of lines) {
        const updated = await tx
          .update(productVariants)
          .set({ stock: sql`${productVariants.stock} - ${line.qty}` })
          .where(and(eq(productVariants.id, line.variantId), gte(productVariants.stock, line.qty)))
          .returning({ id: productVariants.id });
        if (updated.length === 0) throw new CheckoutError(`${line.name} has just sold out.`);
      }

      const [order] = await tx
        .insert(orders)
        .values({
          number,
          token,
          userId: user?.id ?? null,
          name: data.address.name,
          email: data.email,
          phone: data.address.phone,
          shippingAddress: data.address as Address,
          subtotal: totals.subtotal,
          discount: totals.discount,
          couponCode: coupon?.code ?? "",
          shipping: totals.shipping,
          tax: totals.tax,
          total: totals.total,
          paymentMethod: data.paymentMethod,
          paymentStatus: "unpaid",
          gatewayOrderId,
          status: "pending",
          notes: data.notes,
          timeline,
        })
        .returning({ id: orders.id });

      await tx.insert(orderItems).values(lines.map((line) => ({ orderId: order.id, ...line })));

      if (coupon) {
        await tx
          .update(coupons)
          .set({ usedCount: sql`${coupons.usedCount} + 1` })
          .where(eq(coupons.code, coupon.code));
      }
    });
  } catch (error) {
    if (error instanceof CheckoutError) return { ok: false, message: error.message };
    console.error("[checkout] Order failed", error);
    return { ok: false, message: "Something went wrong while placing your order. Please try again." };
  }

  // Stock changed, so product pages must show fresh availability.
  updateTag(TAGS.catalog);

  if (data.paymentMethod === "online") {
    return {
      ok: true,
      token,
      payment: {
        keyId: razorpayKeyId(),
        gatewayOrderId,
        amount: Math.round(totals.total * 100),
        currency: commerce.currency,
        name: data.address.name,
        email: data.email,
        phone: data.address.phone,
        storeName: general.storeName,
      },
    };
  }
  return { ok: true, token };
}

const paymentSchema = z.object({
  token: text(64).min(10),
  orderId: text(64).min(5),
  paymentId: text(64).min(5),
  signature: text(200).min(10),
});

export async function confirmPaymentAction(input: z.input<typeof paymentSchema>): Promise<ActionResult> {
  const parsed = paymentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Payment details were incomplete." };
  const { token, orderId, paymentId, signature } = parsed.data;

  if (!verifyPaymentSignature(orderId, paymentId, signature)) {
    return { ok: false, message: "We could not verify this payment. If money was deducted, contact us with your order number." };
  }

  const db = await getDb();
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.token, token), eq(orders.gatewayOrderId, orderId)))
    .limit(1);
  if (!order) return { ok: false, message: "Order not found." };
  if (order.paymentStatus === "paid") return { ok: true, message: "Payment already recorded." };

  await db
    .update(orders)
    .set({
      paymentStatus: "paid",
      gatewayPaymentId: paymentId,
      status: order.status === "pending" ? "confirmed" : order.status,
      timeline: [...order.timeline, { at: now(), status: "confirmed", note: "Payment received" }],
    })
    .where(eq(orders.id, order.id));

  return { ok: true, message: "Payment received." };
}

/** Lets a customer retry an abandoned online payment from the order page. */
export async function retryPaymentAction(token: string): Promise<{ ok: true; payment: PaymentRequest } | { ok: false; message: string }> {
  if (typeof token !== "string" || !razorpayConfigured()) return { ok: false, message: "Online payment is not available." };
  const [db, config] = await Promise.all([getDb(), getSiteConfig()]);
  const [order] = await db.select().from(orders).where(eq(orders.token, token)).limit(1);
  if (!order || order.paymentMethod !== "online" || order.paymentStatus !== "unpaid" || order.status === "cancelled") {
    return { ok: false, message: "This order does not need a payment." };
  }

  let gatewayOrderId = order.gatewayOrderId;
  if (!gatewayOrderId) {
    try {
      gatewayOrderId = (await createRazorpayOrder(order.total, config.commerce.currency, order.number)).id;
      await db.update(orders).set({ gatewayOrderId }).where(eq(orders.id, order.id));
    } catch {
      return { ok: false, message: "We could not start the payment. Please try again." };
    }
  }

  return {
    ok: true,
    payment: {
      keyId: razorpayKeyId(),
      gatewayOrderId,
      amount: Math.round(order.total * 100),
      currency: config.commerce.currency,
      name: order.name,
      email: order.email,
      phone: order.phone,
      storeName: config.general.storeName,
    },
  };
}

export async function trackAction(numberInput: string, emailInput: string): Promise<{ ok: true; href: string } | { ok: false; message: string }> {
  const number = String(numberInput ?? "").trim().toUpperCase().slice(0, 40);
  const parsedEmail = email.safeParse(emailInput);
  if (!number || !parsedEmail.success) return { ok: false, message: "Enter your order number and the email you ordered with." };

  const db = await getDb();
  const [order] = await db
    .select({ token: orders.token })
    .from(orders)
    .where(and(eq(orders.number, number), eq(sql`lower(${orders.email})`, parsedEmail.data)))
    .limit(1);
  if (order) return { ok: true, href: `/order/${order.token}` };

  const [couture] = await db
    .select({ token: coutureOrders.token })
    .from(coutureOrders)
    .where(and(eq(coutureOrders.number, number), eq(sql`lower(${coutureOrders.email})`, parsedEmail.data)))
    .limit(1);
  if (couture) return { ok: true, href: `/couture/request/${couture.token}` };

  return { ok: false, message: "We could not find an order with those details." };
}

/* ─── Couture requests ─────────────────────────────────────────────────── */

const coutureSchema = z.object({
  serviceId: z.uuid(),
  fabricId: z.uuid().nullable(),
  styles: z.record(z.string().max(80), z.string().max(120)),
  method: z.enum(["self", "store", "home", "garment"]),
  unit: z.enum(["in", "cm"]),
  measurements: z.record(z.string().max(40), z.number().min(0).max(400)),
  appointmentDate: text(20).optional().default(""),
  appointmentSlot: text(40).optional().default(""),
  address: text(500).optional().default(""),
  name: text(120).min(2, "Enter your name"),
  email,
  phone,
  notes: text(2000).optional().default(""),
  saveProfile: z.boolean().optional().default(false),
});

export async function submitCoutureAction(
  input: z.input<typeof coutureSchema>,
): Promise<{ ok: true; token: string } | { ok: false; message: string }> {
  const parsed = coutureSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: firstIssue(parsed.error) };
  const data = parsed.data;

  const [db, user] = await Promise.all([getDb(), getCurrentUser()]);
  const [service] = await db
    .select()
    .from(coutureServices)
    .where(and(eq(coutureServices.id, data.serviceId), eq(coutureServices.active, true)))
    .limit(1);
  if (!service) return { ok: false, message: "This service is no longer available." };

  let fabric: schema.Fabric | undefined;
  if (data.fabricId) {
    [fabric] = await db.select().from(fabrics).where(and(eq(fabrics.id, data.fabricId), eq(fabrics.active, true))).limit(1);
    if (!fabric) return { ok: false, message: "That fabric is no longer available. Please choose another." };
  }

  // Only accept style choices the service actually offers, and price them server-side.
  const styleSelections: { name: string; value: string }[] = [];
  let estimate = service.basePrice + (fabric?.priceDelta ?? 0);
  for (const option of service.styleOptions) {
    const choice = option.choices.find((c) => c.label === data.styles[option.name]) ?? option.choices[0];
    if (!choice) continue;
    styleSelections.push({ name: option.name, value: choice.label });
    estimate += choice.priceDelta;
  }

  const measurements: Record<string, number> = {};
  if (data.method === "self") {
    for (const field of service.measurementFields) {
      const value = data.measurements[field];
      if (!value || value <= 0) return { ok: false, message: "Please fill in every measurement, or choose another way to be measured." };
      measurements[field] = value;
    }
  }
  if ((data.method === "store" || data.method === "home") && !data.appointmentDate) {
    return { ok: false, message: "Choose a preferred date for your fitting." };
  }
  if ((data.method === "home" || data.method === "garment") && data.address.length < 8) {
    return { ok: false, message: "Enter the full address for the visit or pickup." };
  }

  const token = newToken();
  const number = orderNumber("CT");
  await db.insert(coutureOrders).values({
    number,
    token,
    userId: user?.id ?? null,
    name: data.name,
    email: data.email,
    phone: data.phone,
    serviceId: service.id,
    serviceName: service.name,
    fabricId: fabric?.id ?? null,
    fabricName: fabric?.name ?? "To be decided",
    styleSelections,
    measurementMethod: data.method,
    measurementUnit: data.unit,
    measurements,
    appointmentDate: data.appointmentDate,
    appointmentSlot: data.appointmentSlot,
    address: data.address,
    notes: data.notes,
    estimatedPrice: Math.max(estimate, 0),
    status: "requested",
    timeline: [{ at: now(), status: "requested", note: "Request received" }],
  });

  if (user && data.saveProfile && data.method === "self") {
    const profile: MeasurementProfile = {
      id: crypto.randomUUID(),
      name: `${service.name} — ${new Date().toLocaleDateString("en-IN", { month: "short", year: "numeric" })}`,
      unit: data.unit,
      values: measurements,
    };
    await db
      .update(users)
      .set({ measurements: [profile, ...user.measurements].slice(0, 6) })
      .where(eq(users.id, user.id));
  }

  return { ok: true, token };
}

/* ─── Wishlist & profile helpers used by client components ─────────────── */

export async function wishlistProductsAction(ids: string[]): Promise<ProductCardData[]> {
  const parsed = z.array(z.uuid()).max(60).safeParse(ids);
  if (!parsed.success || parsed.data.length === 0) return [];
  const { items } = await getProducts({ ids: parsed.data, perPage: 48 });
  return items;
}

export type Profile = {
  name: string;
  email: string;
  phone: string;
  addresses: Address[];
  measurements: MeasurementProfile[];
};

export async function getProfileAction(): Promise<Profile | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  return { name: user.name, email: user.email, phone: user.phone, addresses: user.addresses, measurements: user.measurements };
}

/* ─── Customer accounts ────────────────────────────────────────────────── */

/** `values` echoes what was typed (never the password) so the form can be refilled after an error. */
export type FormState = { message: string; values?: Record<string, string> } | null;

function typed(formData: FormData, ...names: string[]) {
  return Object.fromEntries(names.map((name) => [name, String(formData.get(name) ?? "").slice(0, 200)]));
}

function safeNext(next: FormDataEntryValue | null, fallback: string) {
  const value = typeof next === "string" ? next : "";
  return value.startsWith("/") && !value.startsWith("//") && !value.includes("\\") ? value : fallback;
}

const loginSchema = z.object({ email, password: z.string().min(1, "Enter your password").max(200) });

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = typed(formData, "email");
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { message: firstIssue(parsed.error), values };

  const db = await getDb();
  const [user] = await db.select().from(users).where(eq(users.email, parsed.data.email)).limit(1);
  // Always run a hash comparison so response time does not reveal whether the email exists.
  const hash = user?.passwordHash ?? "$2a$10$CwTycUXWue0Thq9StjUM0uJ8rT2Y9oQ3n1q1Zc7iQXbSxkZ9bq4Fe";
  const valid = await bcrypt.compare(parsed.data.password, hash);
  if (!user || !valid) return { message: "Incorrect email or password.", values };

  const adminOnly = formData.get("scope") === "admin";
  if (adminOnly && user.role !== "admin") return { message: "This account does not have admin access.", values };

  await createSession({ uid: user.id, role: user.role });
  redirect(adminOnly ? "/admin" : safeNext(formData.get("next"), "/account"));
}

const registerSchema = z.object({
  name: text(120).min(2, "Enter your name"),
  email,
  phone: text(20).optional().default(""),
  password: z.string().min(8, "Use at least 8 characters for your password").max(200),
});

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") ?? "",
    password: formData.get("password"),
  });
  const values = typed(formData, "name", "email", "phone");
  if (!parsed.success) return { message: firstIssue(parsed.error), values };

  const db = await getDb();
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, parsed.data.email)).limit(1);
  if (existing) return { message: "An account with this email already exists. Try signing in instead.", values };

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const [user] = await db
    .insert(users)
    .values({ name: parsed.data.name, email: parsed.data.email, phone: parsed.data.phone, passwordHash, role: "customer" })
    .returning({ id: users.id });

  await createSession({ uid: user.id, role: "customer" });
  redirect(safeNext(formData.get("next"), "/account"));
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}

export async function updateProfileAction(input: { name: string; phone: string }): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Please sign in again." };
  const parsed = z.object({ name: text(120).min(2, "Enter your name"), phone: text(20) }).safeParse(input);
  if (!parsed.success) return { ok: false, message: firstIssue(parsed.error) };
  const db = await getDb();
  await db.update(users).set(parsed.data).where(eq(users.id, user.id));
  return { ok: true, message: "Profile updated." };
}

export async function changePasswordAction(input: { current: string; next: string }): Promise<ActionResult> {
  const session = await getCurrentUser();
  if (!session) return { ok: false, message: "Please sign in again." };
  const parsed = z
    .object({ current: z.string().min(1).max(200), next: z.string().min(8, "Use at least 8 characters").max(200) })
    .safeParse(input);
  if (!parsed.success) return { ok: false, message: firstIssue(parsed.error) };

  const db = await getDb();
  const [user] = await db.select().from(users).where(eq(users.id, session.id)).limit(1);
  if (!user || !(await bcrypt.compare(parsed.data.current, user.passwordHash))) {
    return { ok: false, message: "Your current password is incorrect." };
  }
  await db.update(users).set({ passwordHash: await bcrypt.hash(parsed.data.next, 10) }).where(eq(users.id, user.id));
  return { ok: true, message: "Password changed." };
}

export async function saveAddressesAction(input: Address[]): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Please sign in again." };
  const parsed = z.array(addressSchema).max(5, "You can save up to 5 addresses").safeParse(input);
  if (!parsed.success) return { ok: false, message: firstIssue(parsed.error) };
  const db = await getDb();
  await db.update(users).set({ addresses: parsed.data }).where(eq(users.id, user.id));
  return { ok: true, message: "Addresses saved." };
}

const profileSchema = z.object({
  id: text(60).min(1),
  name: text(80).min(1, "Give this profile a name"),
  unit: z.enum(["in", "cm"]),
  values: z.record(z.string().max(40), z.number().min(0).max(400)),
});

export async function saveMeasurementsAction(input: MeasurementProfile[]): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Please sign in again." };
  const parsed = z.array(profileSchema).max(6, "You can save up to 6 profiles").safeParse(input);
  if (!parsed.success) return { ok: false, message: firstIssue(parsed.error) };
  const db = await getDb();
  await db.update(users).set({ measurements: parsed.data }).where(eq(users.id, user.id));
  return { ok: true, message: "Measurements saved." };
}
