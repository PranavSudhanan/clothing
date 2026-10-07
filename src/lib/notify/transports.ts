import nodemailer, { type Transporter } from "nodemailer";

// Delivery only: how an email or a text message leaves the building.
// What gets sent, and when, lives in ./index.ts and ./templates.ts.

/* ─── Email (any SMTP provider: Gmail, Zoho, Brevo, Resend, Amazon SES…) ─── */

export function emailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.EMAIL_FROM);
}

let transporter: Transporter | null = null;

function smtp() {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT || 587);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS ?? "" } : undefined,
    });
  }
  return transporter;
}

export async function deliverEmail(message: { to: string; subject: string; html: string; text: string }) {
  await smtp().sendMail({
    from: process.env.EMAIL_FROM,
    replyTo: process.env.EMAIL_REPLY_TO || undefined,
    ...message,
  });
}

/* ─── Text messages ──────────────────────────────────────────────────────── */

export type SmsMessage = {
  /** International format, e.g. +919876543210 */
  to: string;
  text: string;
  /** Which message this is, e.g. "order_placed". MSG91 uses it to pick the approved template. */
  event: string;
  /** Values for provider-side templates (MSG91): ##name##, ##order##, ##amount##, ##link##, ##tracking##, ##store## */
  vars: Record<string, string>;
};

export function smsProvider(): "twilio" | "msg91" | null {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_SMS_FROM) return "twilio";
  if (process.env.MSG91_AUTH_KEY) return "msg91";
  return null;
}

export function whatsappConfigured() {
  return Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_FROM);
}

async function twilio(to: string, from: string, body: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const form = new URLSearchParams({ To: to, Body: body });
  // A Messaging Service id (MG…) can be used instead of a phone number.
  form.set(from.startsWith("MG") ? "MessagingServiceSid" : "From", from);

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form,
  });
  if (!response.ok) throw new Error(`Twilio ${response.status}: ${(await response.text()).slice(0, 300)}`);
}

async function msg91(message: SmsMessage) {
  // In India every SMS must match a DLT-approved template, so MSG91 sends by template id.
  const templateId = process.env[`MSG91_TEMPLATE_${message.event.toUpperCase()}`];
  if (!templateId) throw new SkipDelivery(`No MSG91 template set for ${message.event} (MSG91_TEMPLATE_${message.event.toUpperCase()})`);

  const response = await fetch("https://control.msg91.com/api/v5/flow", {
    method: "POST",
    headers: { authkey: process.env.MSG91_AUTH_KEY!, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      template_id: templateId,
      short_url: "0",
      recipients: [{ mobiles: message.to.replace(/\D/g, ""), ...message.vars }],
    }),
  });
  const body = await response.text();
  if (!response.ok || /"type"\s*:\s*"error"/.test(body)) throw new Error(`MSG91 ${response.status}: ${body.slice(0, 300)}`);
}

/** Thrown when a message is deliberately not sent (as opposed to a delivery failure). */
export class SkipDelivery extends Error {}

export async function deliverSms(message: SmsMessage) {
  const provider = smsProvider();
  if (provider === "twilio") return twilio(message.to, process.env.TWILIO_SMS_FROM!, message.text);
  if (provider === "msg91") return msg91(message);
  throw new SkipDelivery("No SMS provider is configured");
}

export async function deliverWhatsapp(message: SmsMessage) {
  const from = process.env.TWILIO_WHATSAPP_FROM!;
  return twilio(`whatsapp:${message.to}`, from.startsWith("whatsapp:") ? from : `whatsapp:${from}`, message.text);
}
