import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { getSiteConfig } from "@/lib/data";
import { toInternationalPhone } from "@/lib/geo";
import { styleEntries, type SiteConfig } from "@/lib/types";
import { formatMoney } from "@/lib/utils";
import {
  coutureReceivedEmail,
  coutureSms,
  orderConfirmationEmail,
  orderSms,
  orderUpdateEmail,
  passwordResetEmail,
  type CoutureEmailData,
  type Email,
  type OrderEmailData,
  type OrderUpdateKind,
} from "./templates";
import { deliverEmail, deliverSms, deliverWhatsapp, emailConfigured, SkipDelivery, smsProvider, whatsappConfigured } from "./transports";

// Customer notifications. Nothing here ever throws: a failed email must never break an order.
// Every attempt is written to the `notifications` table, which the admin panel shows.

export { emailConfigured, smsProvider, whatsappConfigured };

type Entry = { channel: "email" | "sms" | "whatsapp"; event: string; recipient: string; subject: string; reference: string };

async function record(entry: Entry, status: "sent" | "failed" | "skipped", error = "") {
  try {
    const db = await getDb();
    await db.insert(schema.notifications).values({ ...entry, subject: entry.subject.slice(0, 300), status, error: error.slice(0, 500) });
  } catch (cause) {
    console.error("[notify] Could not write the notification log", cause);
  }
}

async function attempt(entry: Entry, send: () => Promise<void>) {
  try {
    await send();
    await record(entry, "sent");
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (error instanceof SkipDelivery) {
      await record(entry, "skipped", message);
    } else {
      console.error(`[notify] ${entry.channel} to ${entry.recipient} failed: ${message}`);
      await record(entry, "failed", message);
    }
    return false;
  }
}

function sendEmail(to: string, email: Email, event: string, reference: string) {
  return attempt({ channel: "email", event, recipient: to, subject: email.subject, reference }, async () => {
    if (!emailConfigured()) {
      // During development, print the message so links (e.g. password resets) can still be used.
      if (process.env.NODE_ENV !== "production") {
        console.log(`\n[email not sent: SMTP is not set up]\nTo: ${to}\nSubject: ${email.subject}\n\n${email.text}\n`);
      }
      throw new SkipDelivery("Email is not set up yet (SMTP_HOST and EMAIL_FROM)");
    }
    await deliverEmail({ to, ...email });
  });
}

async function sendText(phone: string, countryCode: string | undefined, text: string, event: string, reference: string, vars: Record<string, string>) {
  const to = toInternationalPhone(phone, countryCode);
  if (!to) return;
  const message = { to, text, event, vars };
  if (smsProvider()) {
    await attempt({ channel: "sms", event, recipient: to, subject: text, reference }, () => deliverSms(message));
  }
  if (whatsappConfigured()) {
    await attempt({ channel: "whatsapp", event, recipient: to, subject: text, reference }, () => deliverWhatsapp(message));
  }
}

async function loadOrder(orderId: string, baseUrl: string) {
  const db = await getDb();
  const order = await db.query.orders.findFirst({ where: eq(schema.orders.id, orderId), with: { items: true } });
  if (!order) return null;
  const data: OrderEmailData = {
    number: order.number,
    name: order.name,
    url: `${baseUrl}/order/${order.token}`,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    items: order.items.map((item) => ({
      name: item.name,
      variant: [item.color, item.size].filter(Boolean).join(" · "),
      qty: item.qty,
      price: item.price,
      image: item.image,
    })),
    subtotal: order.subtotal,
    discount: order.discount,
    couponCode: order.couponCode,
    shipping: order.shipping,
    total: order.total,
    address: order.shippingAddress,
    trackingNumber: order.trackingNumber,
    trackingUrl: order.trackingUrl,
  };
  return { order, data };
}

function orderVars(config: SiteConfig, data: OrderEmailData) {
  return {
    store: config.general.storeName,
    name: data.name.trim().split(/\s+/)[0] ?? "",
    order: data.number,
    amount: formatMoney(data.total, config.commerce.currency, config.commerce.locale),
    link: data.url,
    tracking: data.trackingNumber ?? "",
  };
}

/** Order confirmation: email plus a text message. */
export async function notifyOrderPlaced(orderId: string, baseUrl: string) {
  try {
    const [loaded, config] = await Promise.all([loadOrder(orderId, baseUrl), getSiteConfig()]);
    if (!loaded) return;
    const { order, data } = loaded;
    await sendEmail(order.email, orderConfirmationEmail(config, data), "order_placed", order.number);
    await sendText(order.phone, order.shippingAddress.countryCode, orderSms(config, data, "placed"), "order_placed", order.number, orderVars(config, data));
  } catch (error) {
    console.error("[notify] Order confirmation failed", error);
  }
}

/** Shipping, delivery and cancellation updates. */
export async function notifyOrderUpdate(orderId: string, kind: OrderUpdateKind, baseUrl: string) {
  try {
    const [loaded, config] = await Promise.all([loadOrder(orderId, baseUrl), getSiteConfig()]);
    if (!loaded) return;
    const { order, data } = loaded;
    const event = `order_${kind}`;
    await sendEmail(order.email, orderUpdateEmail(config, data, kind), event, order.number);
    await sendText(order.phone, order.shippingAddress.countryCode, orderSms(config, data, kind), event, order.number, orderVars(config, data));
  } catch (error) {
    console.error("[notify] Order update failed", error);
  }
}

/** Confirmation that a couture request reached the workshop. */
export async function notifyCoutureReceived(requestId: string, baseUrl: string) {
  try {
    const [db, config] = await Promise.all([getDb(), getSiteConfig()]);
    const [request] = await db.select().from(schema.coutureOrders).where(eq(schema.coutureOrders.id, requestId)).limit(1);
    if (!request) return;
    const data: CoutureEmailData = {
      number: request.number,
      name: request.name,
      url: `${baseUrl}/couture/request/${request.token}`,
      service: request.serviceName,
      fabric: request.fabricName,
      estimate: request.estimatedPrice,
      styles: styleEntries(request.styleSelections),
      appointment: [request.appointmentDate, request.appointmentSlot].filter(Boolean).join(", "),
    };
    await sendEmail(request.email, coutureReceivedEmail(config, data), "couture_received", request.number);
    await sendText(request.phone, "IN", coutureSms(config, data), "couture_received", request.number, {
      store: config.general.storeName,
      name: data.name.trim().split(/\s+/)[0] ?? "",
      order: data.number,
      amount: formatMoney(data.estimate, config.commerce.currency, config.commerce.locale),
      link: data.url,
      tracking: "",
    });
  } catch (error) {
    console.error("[notify] Couture confirmation failed", error);
  }
}

export const RESET_LINK_MINUTES = 60;

export async function sendPasswordReset(user: { name: string; email: string }, url: string) {
  try {
    const config = await getSiteConfig();
    return await sendEmail(user.email, passwordResetEmail(config, { name: user.name, url, minutes: RESET_LINK_MINUTES }), "password_reset", "");
  } catch (error) {
    console.error("[notify] Password reset email failed", error);
    return false;
  }
}

/** Every email with sample data, for the preview in the admin panel. */
export function sampleEmails(config: SiteConfig, baseUrl: string): { key: string; label: string; when: string; email: Email }[] {
  const order: OrderEmailData = {
    number: `${config.commerce.orderPrefix || "AT"}-261007-48213`,
    name: "Arjun Mehta",
    url: `${baseUrl}/track`,
    paymentMethod: "cod",
    paymentStatus: "unpaid",
    items: [
      { name: "Midnight Navy Two-Piece Suit", variant: "Midnight Navy · 40", qty: 1, price: 22999, image: "" },
      { name: "Classic White Poplin Shirt", variant: "Optic White · M", qty: 2, price: 2499, image: "" },
    ],
    subtotal: 27997,
    discount: 1000,
    couponCode: "WELCOME10",
    shipping: 0,
    total: 26997,
    address: { name: "Arjun Mehta", phone: "+91 98765 43210", line1: "42 Sample Street", line2: "Bandra West", city: "Mumbai", state: "Maharashtra", postalCode: "400050", country: "India" },
    trackingNumber: "BD123456789IN",
    trackingUrl: "",
  };
  const couture: CoutureEmailData = {
    number: "CT-261007-40185",
    name: "Arjun Mehta",
    url: `${baseUrl}/track`,
    service: "Three-Piece Suit",
    fabric: "Italian Wool — Midnight Navy",
    estimate: 28499,
    styles: [
      ["Jacket front", "Single-breasted, two button"],
      ["Lapel", "Peak lapel"],
      ["Trouser front", "Flat front"],
    ],
    appointment: "12 Oct 2026, 3pm – 5pm",
  };
  return [
    { key: "order_placed", label: "Order confirmation", when: "Sent as soon as an order is placed (or paid, for online payments).", email: orderConfirmationEmail(config, order) },
    { key: "order_shipped", label: "Shipping update", when: "Sent when you mark an order as shipped.", email: orderUpdateEmail(config, order, "shipped") },
    { key: "order_delivered", label: "Delivered", when: "Sent when you mark an order as delivered.", email: orderUpdateEmail(config, order, "delivered") },
    { key: "order_cancelled", label: "Order cancelled", when: "Sent when you cancel an order.", email: orderUpdateEmail(config, order, "cancelled") },
    { key: "couture_received", label: "Couture request received", when: "Sent when a client submits a couture request.", email: coutureReceivedEmail(config, couture) },
    { key: "password_reset", label: "Password reset", when: "Sent when someone uses “Forgot password”.", email: passwordResetEmail(config, { name: "Arjun Mehta", url: `${baseUrl}/reset-password?token=sample`, minutes: RESET_LINK_MINUTES }) },
  ];
}
