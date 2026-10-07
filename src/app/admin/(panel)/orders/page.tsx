import type { Metadata } from "next";
import Link from "next/link";
import { ListFilters } from "@/components/admin/list-filters";
import { Badge, EmptyRow, PageHeader } from "@/components/admin/ui";
import { adminConfig, adminOrders } from "@/lib/admin-data";
import { ORDER_STATUSES, ORDER_STATUS_LABELS } from "@/lib/types";
import { formatDate, formatMoney, statusTone } from "@/lib/utils";

export const metadata: Metadata = { title: "Orders" };
export const instant = false;

type Props = { searchParams: Promise<{ status?: string; q?: string }> };

export default async function OrdersPage({ searchParams }: Props) {
  const params = await searchParams;
  const status = (ORDER_STATUSES as readonly string[]).includes(params.status ?? "") ? params.status! : "";
  const q = (params.q ?? "").slice(0, 80);
  const [{ rows, counts }, config] = await Promise.all([adminOrders({ status, q }), adminConfig()]);
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);

  return (
    <>
      <PageHeader title="Orders" description="Ready-to-wear orders placed through checkout." />
      <div className="a-card overflow-hidden">
        <ListFilters
          basePath="/admin/orders"
          status={status}
          q={q}
          placeholder="Order number, name, email…"
          tabs={[
            { value: "", label: "All", count: total },
            ...ORDER_STATUSES.map((value) => ({ value, label: ORDER_STATUS_LABELS[value], count: counts[value] ?? 0 })),
          ]}
        />
        {rows.length === 0 ? (
          <EmptyRow>{total === 0 ? "No orders yet. They will appear here as soon as customers check out." : "No orders match this view."}</EmptyRow>
        ) : (
          <div className="overflow-x-auto">
            <table className="a-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((order) => (
                  <tr key={order.id}>
                    <td className="font-medium">
                      <Link href={`/admin/orders/${order.id}`} className="hover:underline">
                        {order.number}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap text-zinc-500">{formatDate(order.createdAt, true)}</td>
                    <td>
                      <span className="block">{order.name}</span>
                      <span className="text-xs text-zinc-500">{order.email}</span>
                    </td>
                    <td className="tabular-nums">{order.items}</td>
                    <td className="tabular-nums">{formatMoney(order.total, config.commerce.currency, config.commerce.locale)}</td>
                    <td>
                      <Badge tone={statusTone(order.paymentStatus)}>
                        {order.paymentMethod === "cod" ? "COD" : "Online"} · {order.paymentStatus}
                      </Badge>
                    </td>
                    <td>
                      <Badge tone={statusTone(order.status)}>{order.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
