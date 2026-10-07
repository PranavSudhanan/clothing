import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/store/account-forms";

export const metadata: Metadata = { title: "Forgot password", robots: { index: false } };

export default function ForgotPasswordPage() {
  return (
    <div className="container-page py-16 md:py-24">
      <div className="mx-auto max-w-md">
        <div className="mb-10 text-center">
          <p className="eyebrow mb-4">Account</p>
          <h1 className="text-4xl md:text-5xl">Forgot your password?</h1>
          <p className="mt-4 text-muted">Enter the email you signed up with and we will send you a link to choose a new one.</p>
        </div>
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
