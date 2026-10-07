"use client";

import { Printer } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateCoutureOrderAction, updateOrderAction } from "@/lib/actions/admin";
import {
  COUTURE_STATUSES,
  COUTURE_STATUS_LABELS,
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUSES,
  type CoutureStatus,
  type OrderStatus,
  type PaymentStatus,
} from "@/lib/types";
import { useToast } from "./ui";

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="a-btn print:hidden">
      <Printer size={15} /> Print
    </button>
  );
}

export function OrderEditor({
  id,
  initial,
}: {
  id: string;
  initial: { status: string; paymentStatus: string; trackingNumber: string; trackingUrl: string; adminNotes: string };
}) {
  const router = useRouter();
  const toast = useToast();
  const [values, setValues] = useState(initial);
  const [notify, setNotify] = useState(true);
  const [pending, start] = useTransition();
  const set = (key: keyof typeof initial) => (event: { target: { value: string } }) => setValues({ ...values, [key]: event.target.value });

  function save() {
    start(async () => {
      const result = await updateOrderAction(
        id,
        { ...values, status: values.status as OrderStatus, paymentStatus: values.paymentStatus as PaymentStatus },
        notify,
      );
      toast(result);
      if (result.ok) router.refresh();
    });
  }

  const closing = ["cancelled", "returned"].includes(values.status) && !["cancelled", "returned"].includes(initial.status);
  // The moments a customer hears from us: shipped, delivered, cancelled, or a tracking number added later.
  const milestone =
    (values.status !== initial.status && ["shipped", "delivered", "cancelled"].includes(values.status)) ||
    (values.status === "shipped" && values.trackingNumber !== "" && values.trackingNumber !== initial.trackingNumber);

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="a-label">Order status</label>
          <select value={values.status} onChange={set("status")} className="a-input">
            {ORDER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {ORDER_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="a-label">Payment</label>
          <select value={values.paymentStatus} onChange={set("paymentStatus")} className="a-input capitalize">
            {PAYMENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>
      {closing && <p className="rounded-lg bg-amber-50 px-3 py-2 text-[13px] text-amber-800">Saving will put these items back into stock.</p>}
      <div>
        <label className="a-label">Tracking number</label>
        <input value={values.trackingNumber} onChange={set("trackingNumber")} placeholder="AWB / consignment number" className="a-input" />
      </div>
      <div>
        <label className="a-label">Tracking link</label>
        <input value={values.trackingUrl} onChange={set("trackingUrl")} placeholder="https://…" className="a-input" />
        <p className="a-help">Customers see the tracking number and link on their order page.</p>
      </div>
      <div>
        <label className="a-label">Internal notes</label>
        <textarea value={values.adminNotes} onChange={set("adminNotes")} rows={3} className="a-input" placeholder="Only visible to your team" />
      </div>
      {milestone && (
        <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-zinc-200 px-3 py-2.5 text-[13.5px]">
          <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="mt-0.5 h-4 w-4 accent-zinc-900" />
          <span>
            <span className="block font-medium">Notify the customer</span>
            <span className="text-xs text-zinc-500">Sends the {values.status} email and text message when you save.</span>
          </span>
        </label>
      )}
      <button type="button" disabled={pending} onClick={save} className="a-btn a-btn-primary">
        {pending ? "Saving…" : "Save changes"}
      </button>
    </div>
  );
}

export function CoutureOrderEditor({
  id,
  initial,
}: {
  id: string;
  initial: { status: string; finalPrice: number | null; advancePaid: number; appointmentDate: string; appointmentSlot: string; adminNotes: string };
}) {
  const router = useRouter();
  const toast = useToast();
  const [values, setValues] = useState({
    ...initial,
    finalPrice: initial.finalPrice === null ? "" : String(initial.finalPrice),
    advancePaid: String(initial.advancePaid),
  });
  const [pending, start] = useTransition();
  const set = (key: keyof typeof values) => (event: { target: { value: string } }) => setValues({ ...values, [key]: event.target.value });

  function save() {
    start(async () => {
      const result = await updateCoutureOrderAction(id, {
        status: values.status as CoutureStatus,
        finalPrice: values.finalPrice,
        advancePaid: Number(values.advancePaid) || 0,
        appointmentDate: values.appointmentDate,
        appointmentSlot: values.appointmentSlot,
        adminNotes: values.adminNotes,
      });
      toast(result);
      if (result.ok) router.refresh();
    });
  }

  return (
    <div className="grid gap-4">
      <div>
        <label className="a-label">Workshop stage</label>
        <select value={values.status} onChange={set("status")} className="a-input">
          {COUTURE_STATUSES.map((status) => (
            <option key={status} value={status}>
              {COUTURE_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
        <p className="a-help">The client sees this stage on their tracking page.</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="a-label">Final price</label>
          <input type="number" min="0" step="any" value={values.finalPrice} onChange={set("finalPrice")} placeholder="Leave empty until quoted" className="a-input" />
        </div>
        <div>
          <label className="a-label">Advance received</label>
          <input type="number" min="0" step="any" value={values.advancePaid} onChange={set("advancePaid")} className="a-input" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="a-label">Fitting date</label>
          <input type="date" value={values.appointmentDate} onChange={set("appointmentDate")} className="a-input" />
        </div>
        <div>
          <label className="a-label">Fitting time</label>
          <input value={values.appointmentSlot} onChange={set("appointmentSlot")} placeholder="e.g. 3pm – 5pm" className="a-input" />
        </div>
      </div>
      <div>
        <label className="a-label">Internal notes</label>
        <textarea value={values.adminNotes} onChange={set("adminNotes")} rows={4} className="a-input" placeholder="Cutter's notes, alterations, delivery details…" />
      </div>
      <button type="button" disabled={pending} onClick={save} className="a-btn a-btn-primary">
        {pending ? "Saving…" : "Save changes"}
      </button>
    </div>
  );
}
