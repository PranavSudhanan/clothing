import { ArrowLeft, ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CoutureOrderEditor, PrintButton } from "@/components/admin/order-editors";
import { Badge, Card } from "@/components/admin/ui";
import { adminConfig, adminCoutureOrder } from "@/lib/admin-data";
import {
  COUTURE_STATUS_LABELS,
  MEASUREMENT_FIELDS,
  MEASUREMENT_METHODS,
  measurementEntries,
  styleEntries,
  type CoutureStatus,
  type MeasurementMethod,
} from "@/lib/types";
import { formatDate, formatMoney, statusTone } from "@/lib/utils";

export const metadata: Metadata = { title: "Couture order" };
export const instant = false;

export default async function CoutureOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [order, config] = await Promise.all([adminCoutureOrder(id), adminConfig()]);
  if (!order) notFound();

  const money = (amount: number) => formatMoney(amount, config.commerce.currency, config.commerce.locale);
  const measurements = measurementEntries(order.measurements);
  const styles = styleEntries(order.styleSelections);
  const balance = (order.finalPrice ?? order.estimatedPrice) - order.advancePaid;

  return (
    <>
      <Link href="/admin/couture-orders" className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-zinc-500 hover:text-zinc-900 print:hidden">
        <ArrowLeft size={14} /> Couture orders
      </Link>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex flex-wrap items-center gap-3 text-[22px] font-semibold tracking-tight">
            {order.number}
            <Badge tone={statusTone(order.status)}>{COUTURE_STATUS_LABELS[order.status as CoutureStatus] ?? order.status}</Badge>
          </h1>
          <p className="mt-1 text-[13.5px] text-zinc-500">
            {order.serviceName} · requested {formatDate(order.createdAt, true)}
          </p>
        </div>
        <div className="flex gap-2">
          <a href={`/couture/request/${order.token}`} target="_blank" rel="noopener noreferrer" className="a-btn print:hidden">
            <ExternalLink size={15} /> Client view
          </a>
          <PrintButton />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <Card title="Client">
              <p className="font-medium">{order.name}</p>
              <p className="mt-1">
                <a href={`tel:${order.phone}`} className="text-zinc-600 hover:underline">
                  {order.phone}
                </a>
              </p>
              <p>
                <a href={`mailto:${order.email}`} className="text-zinc-600 hover:underline">
                  {order.email}
                </a>
              </p>
              {order.address && <p className="mt-3 whitespace-pre-wrap text-zinc-600">{order.address}</p>}
            </Card>
            <Card title="Price">
              <dl className="space-y-1.5 text-[13.5px]">
                <div className="flex justify-between">
                  <dt className="text-zinc-500">Estimate shown to client</dt>
                  <dd className="tabular-nums">{money(order.estimatedPrice)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-zinc-500">Final price</dt>
                  <dd className="tabular-nums">{order.finalPrice === null ? "Not quoted yet" : money(order.finalPrice)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-zinc-500">Advance received</dt>
                  <dd className="tabular-nums">{money(order.advancePaid)}</dd>
                </div>
                <div className="flex justify-between border-t border-zinc-100 pt-2 font-semibold">
                  <dt>Balance due</dt>
                  <dd className="tabular-nums">{money(Math.max(balance, 0))}</dd>
                </div>
              </dl>
            </Card>
          </div>

          <Card title="Garment specification">
            <dl className="grid gap-x-8 gap-y-2.5 text-[13.5px] sm:grid-cols-2">
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Service</dt>
                <dd className="text-right font-medium">{order.serviceName}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Fabric</dt>
                <dd className="text-right font-medium">{order.fabricName}</dd>
              </div>
              {styles.map(([name, value]) => (
                <div key={name} className="flex justify-between gap-4">
                  <dt className="text-zinc-500">{name}</dt>
                  <dd className="text-right font-medium">{value}</dd>
                </div>
              ))}
            </dl>
            {order.notes && (
              <div className="mt-4 rounded-lg bg-zinc-50 p-3.5">
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Client note</p>
                <p className="mt-1 whitespace-pre-wrap text-zinc-700">{order.notes}</p>
              </div>
            )}
          </Card>

          <Card
            title="Measurements"
            description={MEASUREMENT_METHODS[order.measurementMethod as MeasurementMethod] ?? order.measurementMethod}
          >
            {order.appointmentDate && (
              <p className="mb-4 rounded-lg bg-sky-50 px-3 py-2 text-[13.5px] text-sky-800">
                Preferred fitting: <strong>{order.appointmentDate}</strong>
                {order.appointmentSlot && `, ${order.appointmentSlot}`}
              </p>
            )}
            {measurements.length === 0 ? (
              <p className="text-[13.5px] text-zinc-500">No measurements on file yet — they will be taken at the fitting.</p>
            ) : (
              <dl className="grid grid-cols-2 gap-x-8 gap-y-2 text-[13.5px] md:grid-cols-3">
                {measurements.map(([key, value]) => (
                  <div key={key} className="flex justify-between gap-3 border-b border-zinc-100 pb-1.5">
                    <dt className="text-zinc-500">{MEASUREMENT_FIELDS[key]?.label ?? key}</dt>
                    <dd className="font-medium tabular-nums">
                      {value} {order.measurementUnit}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </Card>

          <Card title="Timeline" className="print:hidden">
            <ol className="space-y-3">
              {[...order.timeline].reverse().map((entry, i) => (
                <li key={i} className="flex gap-3 text-[13.5px]">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-zinc-300" />
                  <span>
                    <span className="block">{COUTURE_STATUS_LABELS[entry.status as CoutureStatus] ?? entry.note ?? entry.status}</span>
                    <span className="text-xs text-zinc-500">{formatDate(entry.at, true)}</span>
                  </span>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <div className="print:hidden">
          <Card title="Manage request" className="lg:sticky lg:top-6">
            <CoutureOrderEditor
              id={order.id}
              initial={{
                status: order.status,
                finalPrice: order.finalPrice,
                advancePaid: order.advancePaid,
                appointmentDate: order.appointmentDate,
                appointmentSlot: order.appointmentSlot,
                adminNotes: order.adminNotes,
              }}
            />
          </Card>
        </div>
      </div>
    </>
  );
}
