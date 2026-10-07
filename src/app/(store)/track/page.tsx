import type { Metadata } from "next";
import { TrackForm } from "@/components/store/account-forms";

export const metadata: Metadata = {
  title: "Track your order",
  description: "Check the status of a ready-to-wear order or a couture request.",
};

export default function TrackPage() {
  return (
    <div className="container-page py-16 md:py-24">
      <div className="mx-auto max-w-md text-center">
        <p className="eyebrow mb-4">Order status</p>
        <h1 className="text-4xl md:text-5xl">Track your order</h1>
        <p className="mb-10 mt-4 text-muted">
          Enter the order number from your confirmation and the email you ordered with. Works for couture requests too.
        </p>
        <TrackForm />
      </div>
    </div>
  );
}
