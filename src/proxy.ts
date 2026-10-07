import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session-token";

/**
 * Fast first check for the admin panel: visitors without a valid admin session are sent to the
 * login page before any admin page renders. The real authorisation still happens next to the
 * data (see src/lib/admin-data.ts and src/lib/actions/admin.ts).
 */
export async function proxy(request: NextRequest) {
  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);
  if (session?.role === "admin") return NextResponse.next();
  return NextResponse.redirect(new URL("/admin/login", request.url));
}

export const config = {
  matcher: ["/admin", "/admin/((?!login).*)"],
};
