"use client";

import { Banknote, CreditCard, Lock, Tag, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import {
  confirmPaymentAction,
  placeOrderAction,
  retryPaymentAction,
  validateCouponAction,
  type PaymentRequest,
} from "@/lib/actions/store";
import { computeTotals, type CouponRule } from "@/lib/pricing";
import type { Address } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Notice } from "./forms";
import { LocationFields, type GeoOption } from "./location-fields";
import { markPlaced } from "./placed-popup";
import { useCart, useMoney, useSite } from "./providers";
import { EmptyState, Picture } from "./ui";

type RazorpayResponse = { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string };
type RazorpayInstance = { open: () => void; on: (event: string, handler: () => void) => void };
declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/** Opens Razorpay Checkout and resolves once the payment is verified, dismissed or fails. */
export async function payWithRazorpay(token: string, payment: PaymentRequest): Promise<{ ok: boolean; message: string }> {
  const loaded = await loadRazorpay();
  if (!loaded || !window.Razorpay) return { ok: false, message: "The payment window could not be loaded. Check your connection and try again." };
  const Razorpay = window.Razorpay;

  return new Promise((resolve) => {
    const checkout = new Razorpay({
      key: payment.keyId,
      order_id: payment.gatewayOrderId,
      amount: payment.amount,
      currency: payment.currency,
      name: payment.storeName,
      prefill: { name: payment.name, email: payment.email, contact: payment.phone },
      handler: async (response: RazorpayResponse) => {
        const result = await confirmPaymentAction({
          token,
          orderId: response.razorpay_order_id,
          paymentId: response.razorpay_payment_id,
          signature: response.razorpay_signature,
        });
        resolve(result);
      },
      modal: { ondismiss: () => resolve({ ok: false, message: "Payment was not completed." }) },
    });
    checkout.on("payment.failed", () => resolve({ ok: false, message: "The payment failed. You can try again." }));
    checkout.open();
  });
}

export function PayNowButton({ token }: { token: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [message, setMessage] = useState("");

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        className="btn btn-primary"
        onClick={() =>
          start(async () => {
            setMessage("");
            const request = await retryPaymentAction(token);
            if (!request.ok) return setMessage(request.message);
            const result = await payWithRazorpay(token, request.payment);
            if (result.ok) {
              markPlaced(token);
              router.refresh();
            }
            else setMessage(result.message);
          })
        }
      >
        <Lock size={15} strokeWidth={1.6} /> {pending ? "Opening payment…" : "Complete payment"}
      </button>
      {message && <p className="mt-3 text-sm text-red-600">{message}</p>}
    </div>
  );
}

export type CheckoutUser = { name: string; email: string; phone: string; addresses: Address[] } | null;

const EMPTY: Address = { name: "", phone: "", line1: "", line2: "", city: "", state: "", postalCode: "", country: "" };

export function CheckoutForm({
  user,
  cod,
  online,
  countries,
}: {
  user: CheckoutUser;
  cod: boolean;
  online: boolean;
  /** The countries the store delivers to, for the country dropdown. */
  countries: GeoOption[];
}) {
  const router = useRouter();
  const { lines, ready, clear } = useCart();
  const { commerce } = useSite();
  const money = useMoney();

  const saved = user?.addresses ?? [];
  const [address, setAddress] = useState<Address>(
    saved[0] ?? {
      ...EMPTY,
      name: user?.name ?? "",
      phone: user?.phone ?? "",
      country: countries[0]?.name ?? "",
      countryCode: countries[0]?.code,
    },
  );
  const [email, setEmail] = useState(user?.email ?? "");
  const [notes, setNotes] = useState("");
  const [method, setMethod] = useState<"cod" | "online">(online ? "online" : "cod");
  const [coupon, setCoupon] = useState<CouponRule | null>(null);
  const [couponInput, setCouponInput] = useState("");
  const [couponMessage, setCouponMessage] = useState("");
  const [error, setError] = useState("");
  const [placing, startPlacing] = useTransition();
  const [checkingCoupon, startCoupon] = useTransition();
  const [done, setDone] = useState(false);

  const totals = computeTotals(lines, commerce, coupon);
  const set = (key: keyof Address) => (event: { target: { value: string } }) =>
    setAddress((current) => ({ ...current, [key]: event.target.value }));

  function applyCoupon() {
    setCouponMessage("");
    startCoupon(async () => {
      const result = await validateCouponAction(couponInput, totals.subtotal);
      if (result.ok) {
        setCoupon(result.coupon);
        setCouponInput("");
      } else {
        setCoupon(null);
        setCouponMessage(result.message);
      }
    });
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    startPlacing(async () => {
      const result = await placeOrderAction({
        items: lines.map((line) => ({ variantId: line.variantId, qty: line.qty })),
        email,
        address,
        couponCode: coupon?.code ?? "",
        paymentMethod: method,
        notes,
      });
      if (!result.ok) {
        setError(result.message);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      // The order now exists (and holds the stock), whatever happens with the payment window.
      setDone(true);
      clear();
      // The popup on the order page is only for orders that are really confirmed:
      // cash on delivery straight away, online orders once the payment went through.
      const confirmed = result.payment ? (await payWithRazorpay(result.token, result.payment)).ok : true;
      if (confirmed) markPlaced(result.token);
      router.push(`/order/${result.token}`);
    });
  }

  if (!ready) return <div className="skeleton h-96" />;

  if (lines.length === 0 && !done) {
    return (
      <EmptyState
        title="Your bag is empty"
        text="Add something to your bag before checking out."
        action={
          <Link href="/shop" className="btn btn-primary">
            Start shopping
          </Link>
        }
      />
    );
  }

  if (!cod && !online) {
    return <Notice ok={false}>Checkout is temporarily unavailable. Please contact us to place your order.</Notice>;
  }

  const heading = "mb-5 text-2xl";

  return (
    <form onSubmit={onSubmit} className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_26rem] lg:gap-16">
      <div className="space-y-12">
        {error && <Notice ok={false}>{error}</Notice>}

        <section>
          <div className="flex items-baseline justify-between">
            <h2 className={heading}>Contact</h2>
            {!user && (
              <p className="text-sm text-muted">
                Have an account?{" "}
                <Link href="/login?next=/checkout" className="text-fg underline underline-offset-4">
                  Sign in
                </Link>
              </p>
            )}
          </div>
          <label className="field-label" htmlFor="co-email">
            Email for order updates
          </label>
          <input
            id="co-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
          />
        </section>

        <section>
          <h2 className={heading}>Delivery address</h2>
          {saved.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-2">
              {saved.map((item, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setAddress(item)}
                  className={cn(
                    "border px-3.5 py-2 text-left text-xs transition-colors",
                    item.line1 === address.line1 && item.postalCode === address.postalCode ? "border-fg" : "border-line hover:border-fg",
                  )}
                  style={{ borderRadius: "var(--radius)" }}
                >
                  <span className="block font-medium">{item.name}</span>
                  <span className="text-muted">
                    {item.line1}, {item.city}
                  </span>
                </button>
              ))}
            </div>
          )}
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="co-name">
                Full name
              </label>
              <input id="co-name" required autoComplete="name" value={address.name} onChange={set("name")} className="input" />
            </div>
            <div>
              <label className="field-label" htmlFor="co-phone">
                Phone
              </label>
              <input id="co-phone" required type="tel" autoComplete="tel" value={address.phone} onChange={set("phone")} className="input" />
            </div>
            <div className="sm:col-span-2">
              <label className="field-label" htmlFor="co-line1">
                Address
              </label>
              <input
                id="co-line1"
                required
                autoComplete="address-line1"
                placeholder="House / flat number, street"
                value={address.line1}
                onChange={set("line1")}
                className="input"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="field-label" htmlFor="co-line2">
                Area / landmark <span className="normal-case tracking-normal opacity-70">(optional)</span>
              </label>
              <input id="co-line2" autoComplete="address-line2" value={address.line2 ?? ""} onChange={set("line2")} className="input" />
            </div>
            <LocationFields
              idPrefix="co"
              countries={countries}
              value={address}
              onChange={(patch) => setAddress((current) => ({ ...current, ...patch }))}
            />
            <div>
              <label className="field-label" htmlFor="co-pin">
                PIN code
              </label>
              <input
                id="co-pin"
                required
                inputMode="numeric"
                autoComplete="postal-code"
                value={address.postalCode}
                onChange={set("postalCode")}
                className="input"
              />
            </div>
          </div>
        </section>

        <section>
          <h2 className={heading}>Payment</h2>
          <div className="grid gap-3">
            {online && (
              <label
                className={cn("flex cursor-pointer items-center gap-4 border p-4 transition-colors", method === "online" ? "border-fg" : "border-line")}
                style={{ borderRadius: "var(--radius)" }}
              >
                <input type="radio" name="method" checked={method === "online"} onChange={() => setMethod("online")} className="accent-current" />
                <CreditCard size={22} strokeWidth={1.3} />
                <span>
                  <span className="block text-sm font-medium">Pay online</span>
                  <span className="text-xs text-muted">UPI, cards, net banking and wallets — secured by Razorpay</span>
                </span>
              </label>
            )}
            {cod && (
              <label
                className={cn("flex cursor-pointer items-center gap-4 border p-4 transition-colors", method === "cod" ? "border-fg" : "border-line")}
                style={{ borderRadius: "var(--radius)" }}
              >
                <input type="radio" name="method" checked={method === "cod"} onChange={() => setMethod("cod")} className="accent-current" />
                <Banknote size={22} strokeWidth={1.3} />
                <span>
                  <span className="block text-sm font-medium">Cash on delivery</span>
                  <span className="text-xs text-muted">Pay when your order arrives</span>
                </span>
              </label>
            )}
          </div>
          <label className="field-label mt-6" htmlFor="co-notes">
            Order notes <span className="normal-case tracking-normal opacity-70">(optional)</span>
          </label>
          <textarea
            id="co-notes"
            rows={2}
            maxLength={1000}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Delivery instructions, gift message…"
            className="input"
          />
        </section>
      </div>

      <aside className="h-fit border border-line p-6 md:p-8 lg:sticky lg:top-28" style={{ borderRadius: "var(--radius)" }}>
        <h2 className="text-2xl">Your order</h2>
        <ul className="mt-5 divide-y divide-line">
          {lines.map((line) => (
            <li key={line.variantId} className="flex gap-4 py-4">
              <div className="relative w-14 shrink-0 bg-surface" style={{ aspectRatio: "3 / 4", borderRadius: "var(--radius)" }}>
                <Picture src={line.image} alt="" width={160} />
                <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[0.62rem] font-semibold text-primary-fg">
                  {line.qty}
                </span>
              </div>
              <div className="min-w-0 flex-1 text-sm">
                <p className="font-medium leading-snug">{line.name}</p>
                <p className="mt-0.5 text-xs text-muted">{[line.color, line.size].filter(Boolean).join(" · ")}</p>
              </div>
              <span className="text-sm tabular-nums">{money(line.price * line.qty)}</span>
            </li>
          ))}
        </ul>

        <div className="border-t border-line pt-5">
          {coupon ? (
            <div className="flex items-center justify-between border border-dashed border-accent px-3 py-2.5 text-sm">
              <span className="flex items-center gap-2">
                <Tag size={15} strokeWidth={1.5} className="text-accent" />
                <span className="font-medium">{coupon.code}</span> applied
              </span>
              <button type="button" aria-label="Remove coupon" onClick={() => setCoupon(null)} className="p-1 hover:text-accent">
                <X size={15} />
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (couponInput) applyCoupon();
                  }
                }}
                placeholder="Coupon code"
                aria-label="Coupon code"
                className="input !min-h-11 flex-1 uppercase"
              />
              <button type="button" disabled={!couponInput || checkingCoupon} onClick={applyCoupon} className="btn btn-outline btn-sm !min-h-11">
                {checkingCoupon ? "…" : "Apply"}
              </button>
            </div>
          )}
          {couponMessage && <p className="mt-2 text-xs text-red-600">{couponMessage}</p>}
        </div>

        <dl className="mt-5 space-y-3 border-t border-line pt-5 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Subtotal</dt>
            <dd className="tabular-nums">{money(totals.subtotal)}</dd>
          </div>
          {totals.discount > 0 && (
            <div className="flex justify-between text-accent">
              <dt>Discount</dt>
              <dd className="tabular-nums">−{money(totals.discount)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-muted">Shipping</dt>
            <dd className="tabular-nums">{totals.shipping === 0 ? "Free" : money(totals.shipping)}</dd>
          </div>
          {!commerce.taxInclusive && totals.tax > 0 && (
            <div className="flex justify-between">
              <dt className="text-muted">Tax ({commerce.taxRate}%)</dt>
              <dd className="tabular-nums">{money(totals.tax)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-line pt-4 text-lg">
            <dt>Total</dt>
            <dd className="font-medium tabular-nums">{money(totals.total)}</dd>
          </div>
        </dl>
        {commerce.taxInclusive && <p className="mt-2 text-xs text-muted">Inclusive of all taxes.</p>}

        <button type="submit" disabled={placing || done} className="btn btn-primary btn-block mt-6">
          <Lock size={15} strokeWidth={1.6} />
          {placing || done ? "Placing your order…" : method === "online" ? `Pay ${money(totals.total)}` : "Place order"}
        </button>
        <p className="mt-3 text-center text-xs text-muted">
          By placing your order you agree to our{" "}
          <Link href="/terms" className="underline underline-offset-2">
            terms
          </Link>
          .
        </p>
      </aside>
    </form>
  );
}
