import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PayNowButton } from "@/components/store/checkout-form";
import { InfoCard, ProgressTracker, StatusBadge } from "@/components/store/order-parts";
import { Money } from "@/components/store/providers";
import { Picture } from "@/components/store/ui";
import { getOrderByToken } from "@/lib/orders";
import { razorpayConfigured } from "@/lib/razorpay";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Your order", robots: { index: false } };

const STEPS = [
  { key: "pending", label: "Placed" },
  { key: "confirmed", label: "Confirmed" },
  { key: "processing", label: "Packed" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
];

async function OrderView({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const order = await getOrderByToken(token);
  if (!order) notFound();

  const closed = order.status === "cancelled" || order.status === "returned";
  const awaitingPayment = order.paymentMethod === "online" && order.paymentStatus === "unpaid" && !closed;
  const address = order.shippingAddress;
  const statusLabel = ORDER_STATUS_LABELS[order.status as OrderStatus] ?? order.status;

  return (
    <div className="container-page py-10 md:py-16">
      <div className="mx-auto max-w-4xl">
        <p className="eyebrow mb-3">Order {order.number}</p>
        <h1 className="text-4xl md:text-5xl">
          {closed ? `This order was ${statusLabel.toLowerCase()}` : awaitingPayment ? "One step left — payment" : `Thank you, ${order.name.split(" ")[0]}`}
        </h1>
        <p className="mt-4 max-w-xl text-muted">
          {awaitingPayment
            ? "Your items are reserved. Complete the payment to confirm your order."
            : closed
              ? "If this is unexpected, please get in touch and we will help."
              : `Placed on ${formatDate(order.createdAt, true)}. Bookmark this page to follow your order, or look it up any time under Track order.`}
        </p>

        {awaitingPayment && razorpayConfigured() && (
          <div className="mt-6">
            <PayNowButton token={order.token} />
          </div>
        )}

        {!closed && (
          <div className="mt-10 border border-line p-5 md:p-8" style={{ borderRadius: "var(--radius)" }}>
            <ProgressTracker steps={STEPS} current={order.status} />
            {order.trackingNumber && (
              <p className="mt-6 border-t border-line pt-5 text-sm">
                <span className="text-muted">Tracking number:</span>{" "}
                {order.trackingUrl ? (
                  <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="font-medium underline underline-offset-4">
                    {order.trackingNumber}
                  </a>
                ) : (
                  <span className="font-medium">{order.trackingNumber}</span>
                )}
              </p>
            )}
          </div>
        )}

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          <InfoCard title="Status">
            <StatusBadge status={order.status} label={statusLabel} />
          </InfoCard>
          <InfoCard title="Payment">
            <p>{order.paymentMethod === "cod" ? "Cash on delivery" : "Paid online"}</p>
            <p className="mt-2">
              <StatusBadge status={order.paymentStatus} label={order.paymentStatus} />
            </p>
          </InfoCard>
          <InfoCard title="Delivering to">
            <p className="font-medium">{address.name}</p>
            <p className="text-muted">
              {address.line1}
              {address.line2 ? `, ${address.line2}` : ""}
              <br />
              {address.city}, {address.state} {address.postalCode}
              <br />
              {address.phone}
            </p>
          </InfoCard>
        </div>

        <div className="mt-8 border border-line" style={{ borderRadius: "var(--radius)" }}>
          <ul className="divide-y divide-line px-5 md:px-8">
            {order.items.map((item) => (
              <li key={item.id} className="flex gap-4 py-5">
                <div className="w-16 shrink-0 overflow-hidden bg-surface" style={{ aspectRatio: "3 / 4", borderRadius: "var(--radius)" }}>
                  <Picture src={item.image} alt="" width={200} />
                </div>
                <div className="min-w-0 flex-1 text-sm">
                  {item.slug ? (
                    <Link href={`/product/${item.slug}`} className="font-medium hover:text-accent">
                      {item.name}
                    </Link>
                  ) : (
                    <p className="font-medium">{item.name}</p>
                  )}
                  <p className="mt-1 text-xs text-muted">{[item.color, item.size, `Qty ${item.qty}`].filter(Boolean).join(" · ")}</p>
                </div>
                <Money amount={item.price * item.qty} className="text-sm tabular-nums" />
              </li>
            ))}
          </ul>
          <dl className="space-y-2.5 border-t border-line px-5 py-6 text-sm md:px-8">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd>
                <Money amount={order.subtotal} className="tabular-nums" />
              </dd>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-accent">
                <dt>Discount {order.couponCode && `(${order.couponCode})`}</dt>
                <dd>
                  −<Money amount={order.discount} className="tabular-nums" />
                </dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted">Shipping</dt>
              <dd>{order.shipping === 0 ? "Free" : <Money amount={order.shipping} className="tabular-nums" />}</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-3 text-lg">
              <dt>Total</dt>
              <dd>
                <Money amount={order.total} className="font-medium tabular-nums" />
              </dd>
            </div>
          </dl>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/shop" className="btn btn-primary">
            Continue shopping
          </Link>
          <Link href="/contact" className="btn btn-outline">
            Need help?
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function OrderPage({ params }: { params: Promise<{ token: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="container-page py-16">
          <div className="mx-auto max-w-4xl space-y-6">
            <div className="skeleton h-12 w-2/3" />
            <div className="skeleton h-40" />
            <div className="skeleton h-64" />
          </div>
        </div>
      }
    >
      <OrderView params={params} />
    </Suspense>
  );
}
