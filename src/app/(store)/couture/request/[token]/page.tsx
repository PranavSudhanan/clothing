import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { InfoCard, ProgressTracker, StatusBadge } from "@/components/store/order-parts";
import { Money } from "@/components/store/providers";
import { getCoutureOrderByToken } from "@/lib/orders";
import {
  COUTURE_STATUSES,
  COUTURE_STATUS_LABELS,
  MEASUREMENT_FIELDS,
  MEASUREMENT_METHODS,
  measurementEntries,
  styleEntries,
  type CoutureStatus,
  type MeasurementMethod,
} from "@/lib/types";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Your couture request", robots: { index: false } };

const STEPS = COUTURE_STATUSES.filter((s) => s !== "cancelled").map((key) => ({
  key,
  label: COUTURE_STATUS_LABELS[key].replace("Request received", "Requested").replace("Measurements taken", "Measured"),
}));

async function RequestView({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const order = await getCoutureOrderByToken(token);
  if (!order) notFound();

  const status = order.status as CoutureStatus;
  const cancelled = status === "cancelled";
  const measurements = measurementEntries(order.measurements);
  const styles = styleEntries(order.styleSelections);

  return (
    <div className="container-page py-10 md:py-16">
      <div className="mx-auto max-w-4xl">
        <p className="eyebrow mb-3">Couture request {order.number}</p>
        <h1 className="text-4xl md:text-5xl">
          {cancelled ? "This request was cancelled" : status === "requested" ? "We have your request" : order.serviceName}
        </h1>
        <p className="mt-4 max-w-xl text-muted">
          {status === "requested"
            ? "A member of the workshop will call you within one working day to confirm the details, the final price and your fitting."
            : `Placed on ${formatDate(order.createdAt)}. Bookmark this page to follow your garment through the workshop.`}
        </p>

        {!cancelled && (
          <div className="mt-10 border border-line p-5 md:p-8" style={{ borderRadius: "var(--radius)" }}>
            <ProgressTracker steps={STEPS} current={status} />
          </div>
        )}

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          <InfoCard title="Status">
            <StatusBadge status={status} label={COUTURE_STATUS_LABELS[status] ?? status} />
          </InfoCard>
          <InfoCard title={order.finalPrice ? "Confirmed price" : "Estimated price"}>
            <Money amount={order.finalPrice ?? order.estimatedPrice} className="heading text-2xl" />
            {!order.finalPrice && <p className="mt-1 text-xs text-muted">Final price is confirmed after review.</p>}
            {order.advancePaid > 0 && (
              <p className="mt-1 text-xs text-muted">
                Advance received: <Money amount={order.advancePaid} />
              </p>
            )}
          </InfoCard>
          <InfoCard title="Measurements">
            <p>{MEASUREMENT_METHODS[order.measurementMethod as MeasurementMethod] ?? order.measurementMethod}</p>
            {order.appointmentDate && (
              <p className="mt-1 text-muted">
                {order.appointmentDate}
                {order.appointmentSlot && ` · ${order.appointmentSlot}`}
              </p>
            )}
          </InfoCard>
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <InfoCard title="Your garment">
            <dl className="space-y-2">
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Service</dt>
                <dd className="text-right">{order.serviceName}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Fabric</dt>
                <dd className="text-right">{order.fabricName}</dd>
              </div>
              {styles.map(([name, value]) => (
                <div key={name} className="flex justify-between gap-4">
                  <dt className="text-muted">{name}</dt>
                  <dd className="text-right">{value}</dd>
                </div>
              ))}
            </dl>
            {order.notes && <p className="mt-4 border-t border-line pt-4 text-muted">“{order.notes}”</p>}
          </InfoCard>

          {measurements.length > 0 && (
            <InfoCard title={`Measurements (${order.measurementUnit})`}>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-2">
                {measurements.map(([key, value]) => (
                  <div key={key} className="flex justify-between gap-3">
                    <dt className="text-muted">{MEASUREMENT_FIELDS[key]?.label ?? key}</dt>
                    <dd className="tabular-nums">{value}</dd>
                  </div>
                ))}
              </dl>
            </InfoCard>
          )}
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/couture" className="btn btn-primary">
            Back to couture
          </Link>
          <Link href="/contact" className="btn btn-outline">
            Contact the studio
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CoutureRequestPage({ params }: { params: Promise<{ token: string }> }) {
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
      <RequestView params={params} />
    </Suspense>
  );
}
