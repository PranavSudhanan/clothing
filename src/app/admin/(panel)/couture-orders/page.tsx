import type { Metadata } from "next";
import Link from "next/link";
import { ListFilters } from "@/components/admin/list-filters";
import { Badge, EmptyRow, PageHeader } from "@/components/admin/ui";
import { adminConfig, adminCoutureOrders } from "@/lib/admin-data";
import { COUTURE_STATUSES, COUTURE_STATUS_LABELS, MEASUREMENT_METHODS, type CoutureStatus, type MeasurementMethod } from "@/lib/types";
import { formatDate, formatMoney, statusTone } from "@/lib/utils";

export const metadata: Metadata = { title: "Couture orders" };
export const instant = false;

type Props = { searchParams: Promise<{ status?: string; q?: string }> };

export default async function CoutureOrdersPage({ searchParams }: Props) {
  const params = await searchParams;
  const status = (COUTURE_STATUSES as readonly string[]).includes(params.status ?? "") ? params.status! : "";
  const q = (params.q ?? "").slice(0, 80);
  const [{ rows, counts }, config] = await Promise.all([adminCoutureOrders({ status, q }), adminConfig()]);
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);

  return (
    <>
      <PageHeader title="Couture orders" description="Stitching requests from the couture pages. Review each one, confirm the price, then move it through the workshop." />
      <div className="a-card overflow-hidden">
        <ListFilters
          basePath="/admin/couture-orders"
          status={status}
          q={q}
          placeholder="Number, name, phone…"
          tabs={[
            { value: "", label: "All", count: total },
            ...COUTURE_STATUSES.map((value) => ({ value, label: COUTURE_STATUS_LABELS[value], count: counts[value] ?? 0 })),
          ]}
        />
        {rows.length === 0 ? (
          <EmptyRow>{total === 0 ? "No couture requests yet. They will appear here when a client submits the configurator." : "No requests match this view."}</EmptyRow>
        ) : (
          <div className="overflow-x-auto">
            <table className="a-table">
              <thead>
                <tr>
                  <th>Request</th>
                  <th>Date</th>
                  <th>Client</th>
                  <th>Garment</th>
                  <th>Measuring</th>
                  <th>Price</th>
                  <th>Stage</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((order) => (
                  <tr key={order.id}>
                    <td className="font-medium">
                      <Link href={`/admin/couture-orders/${order.id}`} className="hover:underline">
                        {order.number}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap text-zinc-500">{formatDate(order.createdAt)}</td>
                    <td>
                      <span className="block">{order.name}</span>
                      <span className="text-xs text-zinc-500">{order.phone}</span>
                    </td>
                    <td>
                      <span className="block">{order.serviceName}</span>
                      <span className="text-xs text-zinc-500">{order.fabricName}</span>
                    </td>
                    <td className="text-zinc-600">
                      {MEASUREMENT_METHODS[order.measurementMethod as MeasurementMethod]?.replace("I'll enter my measurements", "Self-measured") ?? order.measurementMethod}
                      {order.appointmentDate && <span className="block text-xs text-zinc-500">{order.appointmentDate}</span>}
                    </td>
                    <td className="tabular-nums">
                      {formatMoney(order.finalPrice ?? order.estimatedPrice, config.commerce.currency, config.commerce.locale)}
                      {!order.finalPrice && <span className="block text-xs text-zinc-400">estimate</span>}
                    </td>
                    <td>
                      <Badge tone={statusTone(order.status)}>{COUTURE_STATUS_LABELS[order.status as CoutureStatus] ?? order.status}</Badge>
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
