import { ArrowLeft, ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderEditor, PrintButton } from "@/components/admin/order-editors";
import { Badge, Card } from "@/components/admin/ui";
import { adminConfig, adminOrder } from "@/lib/admin-data";
import { formatDate, formatMoney, statusTone } from "@/lib/utils";

export const metadata: Metadata = { title: "Order" };
export const instant = false;

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [order, config] = await Promise.all([adminOrder(id), adminConfig()]);
  if (!order) notFound();

  const money = (amount: number) => formatMoney(amount, config.commerce.currency, config.commerce.locale);
  const address = order.shippingAddress;

  return (
    <>
      <Link href="/admin/orders" className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-zinc-500 hover:text-zinc-900 print:hidden">
        <ArrowLeft size={14} /> Orders
      </Link>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex flex-wrap items-center gap-3 text-[22px] font-semibold tracking-tight">
            {order.number}
            <Badge tone={statusTone(order.status)}>{order.status}</Badge>
            <Badge tone={statusTone(order.paymentStatus)}>{order.paymentStatus}</Badge>
          </h1>
          <p className="mt-1 text-[13.5px] text-zinc-500">Placed {formatDate(order.createdAt, true)}</p>
        </div>
        <div className="flex gap-2">
          <a href={`/order/${order.token}`} target="_blank" rel="noopener noreferrer" className="a-btn print:hidden">
            <ExternalLink size={15} /> Customer view
          </a>
          <PrintButton />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-5">
          <Card title={`Items (${order.items.reduce((sum, item) => sum + item.qty, 0)})`}>
            <ul className="-my-2 divide-y divide-zinc-100">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center gap-3.5 py-3">
                  {item.image ? (
                    <img src={item.image} alt="" className="h-14 w-11 rounded-md border border-zinc-200 object-cover" />
                  ) : (
                    <span className="h-14 w-11 rounded-md bg-zinc-100" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-zinc-500">{[item.color, item.size].filter(Boolean).join(" · ")}</p>
                  </div>
                  <span className="text-zinc-500 tabular-nums">
                    {item.qty} × {money(item.price)}
                  </span>
                  <span className="w-24 text-right font-medium tabular-nums">{money(item.qty * item.price)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-1.5 border-t border-zinc-100 pt-4 text-[13.5px]">
              <div className="flex justify-between">
                <dt className="text-zinc-500">Subtotal</dt>
                <dd className="tabular-nums">{money(order.subtotal)}</dd>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between">
                  <dt className="text-zinc-500">Discount {order.couponCode && `(${order.couponCode})`}</dt>
                  <dd className="tabular-nums">−{money(order.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-zinc-500">Shipping</dt>
                <dd className="tabular-nums">{order.shipping === 0 ? "Free" : money(order.shipping)}</dd>
              </div>
              {order.tax > 0 && (
                <div className="flex justify-between">
                  <dt className="text-zinc-500">Tax {config.commerce.taxInclusive && "(included)"}</dt>
                  <dd className="tabular-nums">{money(order.tax)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-zinc-100 pt-2 text-[15px] font-semibold">
                <dt>Total</dt>
                <dd className="tabular-nums">{money(order.total)}</dd>
              </div>
            </dl>
          </Card>

          <div className="grid gap-5 md:grid-cols-2">
            <Card title="Customer">
              <p className="font-medium">{order.name}</p>
              <p className="mt-1">
                <a href={`mailto:${order.email}`} className="text-zinc-600 hover:underline">
                  {order.email}
                </a>
              </p>
              <p>
                <a href={`tel:${order.phone}`} className="text-zinc-600 hover:underline">
                  {order.phone}
                </a>
              </p>
              <p className="mt-3 text-xs text-zinc-500">
                {order.paymentMethod === "cod" ? "Cash on delivery" : "Online payment"}
                {order.gatewayPaymentId && ` · ${order.gatewayPaymentId}`}
              </p>
            </Card>
            <Card title="Ship to">
              <p className="font-medium">{address.name}</p>
              <p className="mt-1 text-zinc-600">
                {address.line1}
                {address.line2 && (
                  <>
                    <br />
                    {address.line2}
                  </>
                )}
                <br />
                {address.city}, {address.state} {address.postalCode}
                <br />
                {address.country}
                <br />
                {address.phone}
              </p>
            </Card>
          </div>

          {order.notes && (
            <Card title="Customer note">
              <p className="whitespace-pre-wrap text-zinc-700">{order.notes}</p>
            </Card>
          )}

          <Card title="Timeline" className="print:hidden">
            <ol className="space-y-3">
              {[...order.timeline].reverse().map((entry, i) => (
                <li key={i} className="flex gap-3 text-[13.5px]">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-zinc-300" />
                  <span>
                    <span className="block">{entry.note ?? entry.status}</span>
                    <span className="text-xs text-zinc-500">{formatDate(entry.at, true)}</span>
                  </span>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <div className="print:hidden">
          <Card title="Manage order" className="lg:sticky lg:top-6">
            <OrderEditor
              id={order.id}
              initial={{
                status: order.status,
                paymentStatus: order.paymentStatus,
                trackingNumber: order.trackingNumber,
                trackingUrl: order.trackingUrl,
                adminNotes: order.adminNotes,
              }}
            />
          </Card>
        </div>
      </div>
    </>
  );
}
