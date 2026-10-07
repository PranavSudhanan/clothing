import { SignJWT, jwtVerify } from "jose";

// Session token primitives with no Next.js request APIs, so both server code and proxy.ts can use them.

export const SESSION_COOKIE = "atelier_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

export type Session = { uid: string; role: "admin" | "customer" };

/** False when SESSION_SECRET is missing or too short, i.e. nobody can be signed in on this server. */
export function sessionConfigured() {
  return (process.env.SESSION_SECRET ?? "").length >= 16 || process.env.NODE_ENV === "development";
}

function signingKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    if (process.env.NODE_ENV === "development") {
      return new TextEncoder().encode("development-only-secret-do-not-use-in-production");
    }
    throw new Error("SESSION_SECRET is missing or shorter than 16 characters. Set it in your environment variables.");
  }
  return new TextEncoder().encode(secret);
}

export function signSession(session: Session) {
  return new SignJWT({ role: session.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(session.uid)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(signingKey());
}

export async function verifySession(token: string | undefined): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, signingKey(), { algorithms: ["HS256"] });
    if (!payload.sub) return null;
    return { uid: payload.sub, role: payload.role === "admin" ? "admin" : "customer" };
  } catch {
    return null;
  }
}
