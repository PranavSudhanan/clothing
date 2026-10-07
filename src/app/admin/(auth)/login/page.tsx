import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AdminLoginForm } from "@/components/admin/login-form";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Admin sign in", robots: { index: false, follow: false } };

async function Gate() {
  const user = await getCurrentUser();
  if (user?.role === "admin") redirect("/admin");
  return <AdminLoginForm />;
}

export default function AdminLoginPage() {
  return (
    <div className="admin flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-900 text-lg font-semibold text-white">
            A
          </span>
          <h1 className="text-xl font-semibold tracking-tight">Store admin</h1>
          <p className="mt-1 text-[13.5px] text-zinc-500">Sign in to manage your store.</p>
        </div>
        <div className="a-card p-6">
          <Suspense fallback={<div className="h-52" />}>
            <Gate />
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
