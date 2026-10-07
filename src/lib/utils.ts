import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatMoney(amount: number, currency = "INR", locale = "en-IN") {
  const value = Number.isFinite(amount) ? amount : 0;
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function formatDate(value: Date | string | null | undefined, withTime = false) {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
    timeZone: "Asia/Kolkata",
  });
}

/** Unsplash and similar CDNs accept a width param; everything else is returned untouched. */
export function imageUrl(src: string, width: number) {
  if (!src) return "";
  if (src.includes("images.unsplash.com")) {
    const base = src.split("?")[0];
    return `${base}?auto=format&fit=crop&w=${width}&q=75`;
  }
  return src;
}

export function percentOff(price: number, compareAt?: number | null) {
  if (!compareAt || compareAt <= price) return 0;
  return Math.round(((compareAt - price) / compareAt) * 100);
}

export function titleCase(s: string) {
  return s.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function isExternal(href: string) {
  return /^(https?:)?\/\//.test(href) || href.startsWith("mailto:") || href.startsWith("tel:");
}

/** Colour tone for a status badge in the admin panel. */
export function statusTone(status: string): "neutral" | "good" | "warn" | "bad" | "info" {
  if (["delivered", "paid", "ready", "active", "closed"].includes(status)) return "good";
  if (["cancelled", "returned", "refunded"].includes(status)) return "bad";
  if (["pending", "requested", "unpaid", "new", "draft"].includes(status)) return "warn";
  return "info";
}
