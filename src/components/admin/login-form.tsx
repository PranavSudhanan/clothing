"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction } from "@/lib/actions/store";

export function AdminLoginForm({ notice }: { notice?: string }) {
  const [state, action, pending] = useActionState(loginAction, null);

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="scope" value="admin" />
      {notice && !state?.message && (
        <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[13px] text-emerald-800">
          {notice}
        </p>
      )}
      <div>
        <label htmlFor="admin-email" className="a-label">
          Email
        </label>
        <input
          id="admin-email"
          name="email"
          type="email"
          required
          autoComplete="username"
          defaultValue={state?.values?.email ?? ""}
          className="a-input"
        />
      </div>
      <div>
        <label htmlFor="admin-password" className="a-label">
          Password
        </label>
        <input id="admin-password" name="password" type="password" required autoComplete="current-password" className="a-input" />
      </div>
      {state?.message && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
          {state.message}
        </p>
      )}
      <button type="submit" disabled={pending} className="a-btn a-btn-primary !min-h-10 w-full">
        {pending ? "Signing in…" : "Sign in"}
      </button>
      <Link href="/forgot-password" className="text-center text-[13px] text-zinc-500 hover:text-zinc-900">
        Forgot password?
      </Link>
    </form>
  );
}
