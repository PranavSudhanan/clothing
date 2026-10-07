import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutForm } from "@/components/store/checkout-form";
import { getCurrentUser } from "@/lib/auth";
import { getSiteConfig } from "@/lib/data";
import { razorpayConfigured } from "@/lib/razorpay";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

async function CheckoutLoader() {
  const [user, config] = await Promise.all([getCurrentUser(), getSiteConfig()]);
  return (
    <CheckoutForm
      user={user ? { name: user.name, email: user.email, phone: user.phone, addresses: user.addresses } : null}
      cod={config.commerce.codEnabled}
      online={config.commerce.onlineEnabled && razorpayConfigured()}
    />
  );
}

export default function CheckoutPage() {
  return (
    <div className="container-page py-10 md:py-16">
      <h1 className="mb-10 text-4xl md:text-6xl">Checkout</h1>
      <Suspense fallback={<div className="skeleton h-[32rem]" />}>
        <CheckoutLoader />
      </Suspense>
    </div>
  );
}
