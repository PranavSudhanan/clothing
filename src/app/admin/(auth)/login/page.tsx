import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AdminLoginForm } from "@/components/admin/login-form";
import { getDb, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { getSiteConfig } from "@/lib/data";
import { sessionConfigured } from "@/lib/session-token";

export const metadata: Metadata = { title: "Admin sign in", robots: { index: false, follow: false } };

type Props = { searchParams: Promise<{ reset?: string | string[] }> };

/** Things that must be configured before anyone can sign in. Shown instead of a confusing failure. */
async function setupProblems() {
  const problems: { title: string; text: string }[] = [];

  if (!sessionConfigured()) {
    problems.push({
      title: "SESSION_SECRET is missing",
      text: "Add an environment variable named SESSION_SECRET containing a long random string (at least 16 characters), then redeploy. Sign-in cannot work without it.",
    });
  }

  const db = await getDb();
  const admins = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.role, "admin")).limit(1);
  if (admins.length === 0) {
    problems.push({
      title: "No admin account exists yet",
      text: "Add the environment variables ADMIN_EMAIL and ADMIN_PASSWORD (8+ characters), then redeploy. The account is created during the build.",
    });
  }
  return problems;
}

async function Gate({ searchParams }: Props) {
  const [user, { reset }] = await Promise.all([getCurrentUser(), searchParams]);
  if (user?.role === "admin") redirect("/admin");
  const problems = await setupProblems();

  return (
    <>
      {problems.length > 0 && (
        <div role="alert" className="mb-5 rounded-lg border border-amber-300 bg-amber-50 p-3.5 text-[13px] text-amber-900">
          <p className="font-semibold">Setup is not finished</p>
          <ul className="mt-2 space-y-2">
            {problems.map((problem) => (
              <li key={problem.title}>
                <span className="font-medium">{problem.title}.</span> {problem.text}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-amber-800">
            On Vercel: Project → Settings → Environment Variables. Changes apply to the next deployment.
          </p>
        </div>
      )}
      <AdminLoginForm notice={reset ? "Your password has been changed. Sign in with the new one." : undefined} />
    </>
  );
}

export default async function AdminLoginPage({ searchParams }: Props) {
  const { general } = await getSiteConfig();

  return (
    <div className="admin flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-900 text-lg font-semibold text-white">
            {general.storeName.slice(0, 1).toUpperCase()}
          </span>
          <h1 className="text-xl font-semibold tracking-tight">{general.storeName} admin</h1>
          <p className="mt-1 text-[13.5px] text-zinc-500">Sign in to manage your store.</p>
        </div>
        <div className="a-card p-6">
          <Suspense fallback={<div className="h-52" />}>
            <Gate searchParams={searchParams} />
          </Suspense>
        </div>
        <p className="mt-5 text-center text-[13px] text-zinc-500">
          <Link href="/" className="hover:text-zinc-900">
            ← Back to the storefront
          </Link>
        </p>
      </div>
    </div>
  );
}
