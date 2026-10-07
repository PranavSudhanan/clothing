import type { Address, SiteConfig } from "@/lib/types";
import { formatMoney } from "@/lib/utils";

// Email and text-message content. Pure functions: data in, { subject, html, text } out —
// so the admin panel can preview exactly what customers receive.

export type Email = { subject: string; html: string; text: string };

export type OrderEmailData = {
  number: string;
  name: string;
  url: string;
  paymentMethod: "cod" | "online";
  paymentStatus: string;
  items: { name: string; variant: string; qty: number; price: number; image: string }[];
  subtotal: number;
  discount: number;
  couponCode: string;
  shipping: number;
  total: number;
  address: Address;
  trackingNumber?: string;
  trackingUrl?: string;
};

const esc = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const HEX = /^#[0-9a-fA-F]{3,8}$/;
const safeColor = (value: string, fallback: string) => (HEX.test(value) ? value : fallback);

function palette(config: SiteConfig) {
  const c = config.theme.colors;
  return {
    bg: safeColor(c.bg, "#faf8f4"),
    card: "#ffffff",
    text: safeColor(c.fg, "#1b1916"),
    muted: safeColor(c.muted, "#6b655c"),
    line: safeColor(c.line, "#ddd5c8"),
    button: safeColor(c.primary, "#1b1916"),
    buttonText: safeColor(c.primaryFg, "#ffffff"),
    accent: safeColor(c.accent, "#96763f"),
  };
}

const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "Arial, Helvetica, sans-serif";

function layout(config: SiteConfig, options: { preheader: string; heading: string; body: string }) {
  const p = palette(config);
  const { general } = config;
  const brand = /^https?:\/\//.test(general.logoUrl)
    ? `<img src="${esc(general.logoUrl)}" alt="${esc(general.storeName)}" height="${Math.min(Math.max(general.logoHeight, 20), 60)}" style="display:block;margin:0 auto;border:0;">`
    : `<span style="font-family:${SERIF};font-size:28px;letter-spacing:2px;color:${p.text};">${esc(general.storeName)}</span>`;
  const contact = [general.phone, general.email].filter(Boolean).map(esc).join(" &nbsp;·&nbsp; ");

  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(options.heading)}</title></head>
<body style="margin:0;padding:0;background:${p.bg};">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(options.preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${p.bg};">
<tr><td align="center" style="padding:32px 12px;">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;">
    <tr><td align="center" style="padding:0 0 24px;">${brand}</td></tr>
    <tr><td style="background:${p.card};border:1px solid ${p.line};padding:36px 32px;font-family:${SANS};font-size:15px;line-height:1.6;color:${p.text};">
      <h1 style="margin:0 0 16px;font-family:${SERIF};font-weight:normal;font-size:28px;line-height:1.2;color:${p.text};">${esc(options.heading)}</h1>
      ${options.body}
    </td></tr>
    <tr><td align="center" style="padding:24px 16px 0;font-family:${SANS};font-size:12px;line-height:1.6;color:${p.muted};">
      ${esc(general.storeName)}${general.address ? ` · ${esc(general.address)}` : ""}<br>${contact}
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>`;
}

function button(config: SiteConfig, label: string, href: string) {
  const p = palette(config);
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 8px;"><tr><td style="background:${p.button};">
    <a href="${esc(href)}" style="display:inline-block;padding:14px 28px;font-family:${SANS};font-size:13px;letter-spacing:1.5px;text-transform:uppercase;text-decoration:none;color:${p.buttonText};">${esc(label)}</a>
  </td></tr></table>`;
}

function orderSummary(config: SiteConfig, order: OrderEmailData) {
  const p = palette(config);
  const money = (amount: number) => formatMoney(amount, config.commerce.currency, config.commerce.locale);
  const cell = `padding:12px 0;border-bottom:1px solid ${p.line};font-family:${SANS};font-size:14px;color:${p.text};vertical-align:top;`;

  const rows = order.items
    .map(
      (item) => `<tr>
        <td style="${cell}">${esc(item.name)}<br><span style="font-size:12px;color:${p.muted};">${esc([item.variant, `Qty ${item.qty}`].filter(Boolean).join(" · "))}</span></td>
        <td align="right" style="${cell}white-space:nowrap;">${esc(money(item.price * item.qty))}</td>
      </tr>`,
    )
    .join("");

  const line = (label: string, value: string, strong = false) =>
    `<tr><td style="padding:6px 0;font-family:${SANS};font-size:${strong ? 16 : 14}px;color:${strong ? p.text : p.muted};${strong ? "font-weight:bold;" : ""}">${esc(label)}</td>
     <td align="right" style="padding:6px 0;font-family:${SANS};font-size:${strong ? 16 : 14}px;color:${p.text};${strong ? "font-weight:bold;" : ""}">${esc(value)}</td></tr>`;

  const a = order.address;
  const address = [a.name, a.line1, a.line2, `${a.city}, ${a.state} ${a.postalCode}`, a.country, a.phone].filter(Boolean).map((l) => esc(String(l))).join("<br>");

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;border-top:1px solid ${p.line};">${rows}</table>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;">
    ${line("Subtotal", money(order.subtotal))}
    ${order.discount > 0 ? line(`Discount${order.couponCode ? ` (${order.couponCode})` : ""}`, `−${money(order.discount)}`) : ""}
    ${line("Shipping", order.shipping === 0 ? "Free" : money(order.shipping))}
    ${line("Total", money(order.total), true)}
  </table>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;"><tr>
    <td width="50%" style="vertical-align:top;font-family:${SANS};font-size:13px;line-height:1.6;color:${p.text};">
      <span style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${p.muted};">Delivering to</span><br>${address}
    </td>
    <td width="50%" style="vertical-align:top;font-family:${SANS};font-size:13px;line-height:1.6;color:${p.text};">
      <span style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${p.muted};">Payment</span><br>
      ${order.paymentMethod === "cod" ? "Cash on delivery" : order.paymentStatus === "paid" ? "Paid online" : "Online payment"}
    </td>
  </tr></table>`;
}

function orderText(config: SiteConfig, order: OrderEmailData) {
  const money = (amount: number) => formatMoney(amount, config.commerce.currency, config.commerce.locale);
  return [
    ...order.items.map((i) => `- ${i.name}${i.variant ? ` (${i.variant})` : ""} x ${i.qty}: ${money(i.price * i.qty)}`),
    "",
    `Total: ${money(order.total)}`,
    `Payment: ${order.paymentMethod === "cod" ? "Cash on delivery" : "Online"}`,
  ].join("\n");
}

const firstName = (name: string) => name.trim().split(/\s+/)[0] || "there";
const para = (text: string) => `<p style="margin:0 0 12px;">${text}</p>`;

export function orderConfirmationEmail(config: SiteConfig, order: OrderEmailData): Email {
  const store = config.general.storeName;
  const intro = `Thank you, ${firstName(order.name)}. We have received your order and are getting it ready.`;
  return {
    subject: `Your ${store} order ${order.number} is confirmed`,
    html: layout(config, {
      preheader: `Order ${order.number} — ${formatMoney(order.total, config.commerce.currency, config.commerce.locale)}`,
      heading: "Order confirmed",
      body: `${para(esc(intro))}${para(`Order number: <strong>${esc(order.number)}</strong>`)}
        ${config.commerce.deliveryNote ? para(`<span style="color:#666;">${esc(config.commerce.deliveryNote)}</span>`) : ""}
        ${button(config, "View your order", order.url)}
        ${orderSummary(config, order)}`,
    }),
    text: `${intro}\n\nOrder number: ${order.number}\n\n${orderText(config, order)}\n\nView your order: ${order.url}\n\n${store}`,
  };
}

export type OrderUpdateKind = "shipped" | "delivered" | "cancelled";

export function orderUpdateEmail(config: SiteConfig, order: OrderEmailData, kind: OrderUpdateKind): Email {
  const store = config.general.storeName;
  const copy = {
    shipped: {
      subject: `Your ${store} order ${order.number} is on its way`,
      heading: "Your order has shipped",
      intro: `Good news, ${firstName(order.name)} — your order has left our studio.`,
    },
    delivered: {
      subject: `Your ${store} order ${order.number} has been delivered`,
      heading: "Delivered",
      intro: `${firstName(order.name)}, your order has been delivered. We hope you love it.`,
    },
    cancelled: {
      subject: `Your ${store} order ${order.number} has been cancelled`,
      heading: "Order cancelled",
      intro: `${firstName(order.name)}, your order has been cancelled. If you paid online, the refund will reach you within 5 – 7 working days.`,
    },
  }[kind];

  const tracking =
    kind === "shipped" && order.trackingNumber
      ? para(
          `Tracking number: <strong>${esc(order.trackingNumber)}</strong>${
            order.trackingUrl ? ` — <a href="${esc(order.trackingUrl)}" style="color:inherit;">track the parcel</a>` : ""
          }`,
        )
      : "";
  const help = kind === "cancelled" ? para("If this was a mistake, just reply to this email and we will help.") : "";
  const link = kind === "shipped" && order.trackingUrl ? order.trackingUrl : order.url;

  return {
    subject: copy.subject,
    html: layout(config, {
      preheader: copy.intro,
      heading: copy.heading,
      body: `${para(esc(copy.intro))}${para(`Order number: <strong>${esc(order.number)}</strong>`)}${tracking}${help}
        ${button(config, kind === "shipped" ? "Track your order" : "View your order", link)}
        ${kind === "cancelled" ? "" : orderSummary(config, order)}`,
    }),
    text: `${copy.intro}\n\nOrder number: ${order.number}${
      kind === "shipped" && order.trackingNumber ? `\nTracking number: ${order.trackingNumber}` : ""
    }\n\n${link}\n\n${store}`,
  };
}

export type CoutureEmailData = {
  number: string;
  name: string;
  url: string;
  service: string;
  fabric: string;
  estimate: number;
  styles: [string, string][];
  appointment: string;
};

export function coutureReceivedEmail(config: SiteConfig, request: CoutureEmailData): Email {
  const store = config.general.storeName;
  const c = palette(config);
  const money = formatMoney(request.estimate, config.commerce.currency, config.commerce.locale);
  const intro = `Thank you, ${firstName(request.name)}. We have your ${request.service.toLowerCase()} request and a member of our workshop will call you within one working day to confirm the details, the final price and your fitting.`;
  const row = (label: string, value: string) =>
    `<tr><td style="padding:8px 0;border-bottom:1px solid ${c.line};font-family:${SANS};font-size:14px;color:${c.muted};">${esc(label)}</td>
     <td align="right" style="padding:8px 0;border-bottom:1px solid ${c.line};font-family:${SANS};font-size:14px;color:${c.text};">${esc(value)}</td></tr>`;

  return {
    subject: `We have your ${store} couture request ${request.number}`,
    html: layout(config, {
      preheader: `${request.service} — estimated ${money}`,
      heading: "Request received",
      body: `${para(esc(intro))}${para(`Request number: <strong>${esc(request.number)}</strong>`)}
        ${button(config, "Follow your request", request.url)}
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;border-top:1px solid ${c.line};">
          ${row("Garment", request.service)}${row("Fabric", request.fabric)}
          ${request.styles.map(([name, value]) => row(name, value)).join("")}
          ${request.appointment ? row("Preferred fitting", request.appointment) : ""}
          ${row("Estimated price", money)}
        </table>
        <p style="margin:16px 0 0;font-size:13px;color:${c.muted};">No payment is due yet. The final price is confirmed with you before any work begins.</p>`,
    }),
    text: `${intro}\n\nRequest number: ${request.number}\nGarment: ${request.service}\nFabric: ${request.fabric}\nEstimated price: ${money}\n\nFollow your request: ${request.url}\n\n${store}`,
  };
}

export function passwordResetEmail(config: SiteConfig, data: { name: string; url: string; minutes: number }): Email {
  const store = config.general.storeName;
  const intro = `Hello ${firstName(data.name)}, we received a request to reset the password for your ${store} account.`;
  return {
    subject: `Reset your ${store} password`,
    html: layout(config, {
      preheader: "Use this link to choose a new password.",
      heading: "Reset your password",
      body: `${para(esc(intro))}${para(`This link works once and expires in ${data.minutes} minutes.`)}
        ${button(config, "Choose a new password", data.url)}
        <p style="margin:16px 0 0;font-size:13px;color:#777;">If you did not ask for this, you can ignore this email — your password stays the same.</p>`,
    }),
    text: `${intro}\n\nChoose a new password (link expires in ${data.minutes} minutes):\n${data.url}\n\nIf you did not ask for this, ignore this email.\n\n${store}`,
  };
}

/* ─── Text messages (kept under 160 characters where possible) ───────────── */

export function orderSms(config: SiteConfig, order: Pick<OrderEmailData, "number" | "total" | "url" | "trackingNumber">, event: "placed" | OrderUpdateKind) {
  const store = config.general.storeName;
  const money = formatMoney(order.total, config.commerce.currency, config.commerce.locale);
  switch (event) {
    case "placed":
      return `${store}: Order ${order.number} confirmed. Total ${money}. Track it here: ${order.url}`;
    case "shipped":
      return `${store}: Order ${order.number} has shipped.${order.trackingNumber ? ` Tracking no. ${order.trackingNumber}.` : ""} ${order.url}`;
    case "delivered":
      return `${store}: Order ${order.number} has been delivered. Thank you for shopping with us.`;
    case "cancelled":
      return `${store}: Order ${order.number} has been cancelled. Questions? Reply to our email or call us.`;
  }
}

export function coutureSms(config: SiteConfig, request: Pick<CoutureEmailData, "number" | "service" | "url">) {
  return `${config.general.storeName}: We have your ${request.service} request ${request.number}. Our workshop will call you within one working day. ${request.url}`;
}
