import "server-only";

import { headers } from "next/headers";

/**
 * The public address of the site, for links inside emails and text messages.
 * A configured address always wins, so a forged Host header can never point a
 * password-reset link at someone else's domain.
 */
export async function siteUrl(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");
  if (configured) return configured;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;

  const list = await headers();
  const host = list.get("x-forwarded-host") ?? list.get("host");
  if (host) {
    const local = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host);
    return `${list.get("x-forwarded-proto") ?? (local ? "http" : "https")}://${host}`;
  }
  return "http://localhost:3000";
}
