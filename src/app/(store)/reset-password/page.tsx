import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/store/account-forms";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false } };

type Props = { searchParams: Promise<{ token?: string | string[] }> };

async function Form({ searchParams }: Props) {
  const { token } = await searchParams;
  if (typeof token !== "string" || token.length < 20) {
    return (
      <div className="grid gap-5 text-center">
        <p className="text-muted">This link is incomplete. Open the link from your email again, or request a new one.</p>
        <Link href="/forgot-password" className="btn btn-primary btn-block">
          Request a new link
        </Link>
      </div>
    );
  }
  return <ResetPasswordForm token={token} />;
}

export default function ResetPasswordPage({ searchParams }: Props) {
  return (
    <div className="container-page py-16 md:py-24">
      <div className="mx-auto max-w-md">
        <div className="mb-10 text-center">
          <p className="eyebrow mb-4">Account</p>
          <h1 className="text-4xl md:text-5xl">Choose a new password</h1>
        </div>
        <Suspense fallback={<div className="skeleton h-56" />}>
          <Form searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}
