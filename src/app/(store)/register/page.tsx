import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthForm } from "@/components/store/account-forms";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = { title: "Create account", robots: { index: false } };

type Props = { searchParams: Promise<{ next?: string | string[] }> };

async function Form({ searchParams }: Props) {
  const [{ next }, session] = await Promise.all([searchParams, getSession()]);
  const target = typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : "/account";
  if (session) redirect(target);
  return <AuthForm mode="register" next={target} />;
}

export default function RegisterPage({ searchParams }: Props) {
  return (
    <div className="container-page py-16 md:py-24">
      <div className="mx-auto max-w-md">
        <div className="mb-10 text-center">
          <p className="eyebrow mb-4">Account</p>
          <h1 className="text-4xl md:text-5xl">Create your account</h1>
          <p className="mt-4 text-muted">Track orders, save addresses and keep your measurements on file.</p>
        </div>
        <Suspense fallback={<div className="skeleton h-72" />}>
          <Form searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}
