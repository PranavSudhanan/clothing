"use client";

import { Check, Mail, MessageSquare, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useSyncExternalStore } from "react";

// The "order placed" popup. Checkout leaves a note in sessionStorage naming the order it just
// created; the order page shows the popup once for that order and clears the note when it closes.

const KEY = "atelier.justPlaced";
const listeners = new Set<() => void>();

function read() {
  try {
    return window.sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function write(token: string | null) {
  try {
    if (token) window.sessionStorage.setItem(KEY, token);
    else window.sessionStorage.removeItem(KEY);
  } catch {
    // Storage unavailable: the order page still shows the confirmation, just without the popup.
  }
  listeners.forEach((listener) => listener());
}

/** Call right after an order or couture request succeeds, before going to its page. */
export function markPlaced(token: string) {
  write(token);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

type Props = {
  token: string;
  kind: "order" | "couture";
  number: string;
  name: string;
  email: string;
  phone: string;
  /** Whether a confirmation email / text message is actually being sent. */
  emailed: boolean;
  texted: boolean;
};

export function PlacedPopup({ token, kind, number, name, email, phone, emailed, texted }: Props) {
  const open = useSyncExternalStore(
    subscribe,
    () => read() === token,
    () => false,
  );
  const close = () => write(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && write(null);
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!open) return null;

  const first = name.trim().split(/\s+/)[0] || "there";
  const copy =
    kind === "order"
      ? {
          title: "Order placed",
          text: `Thank you, ${first}. Your order is confirmed and we are getting it ready.`,
          label: "Order number",
          primary: "View order details",
          secondary: { label: "Continue shopping", href: "/shop" },
        }
      : {
          title: "Request received",
          text: `Thank you, ${first}. Our workshop will call you within one working day to confirm the details and your fitting.`,
          label: "Request number",
          primary: "View my request",
          secondary: { label: "Back to couture", href: "/couture" },
        };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="placed-title">
      <button type="button" aria-label="Close" className="animate-fade-in absolute inset-0 bg-black/55" onClick={close} />
      <div
        className="animate-fade-up relative w-full max-w-md border border-line bg-bg p-8 text-center text-fg shadow-2xl md:p-10"
        style={{ borderRadius: "var(--radius)" }}
      >
        <button type="button" aria-label="Close" onClick={close} className="absolute right-3 top-3 p-2 text-muted hover:text-fg">
          <X size={20} strokeWidth={1.4} />
        </button>

        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent text-accent-fg">
          <Check size={30} strokeWidth={1.6} />
        </span>
        <h2 id="placed-title" className="mt-6 text-4xl">
          {copy.title}
        </h2>
        <p className="mt-3 leading-relaxed text-muted">{copy.text}</p>

        <p className="mt-6 border-y border-line py-4">
          <span className="block text-[0.7rem] uppercase tracking-[0.16em] text-muted">{copy.label}</span>
          <span className="mt-1 block text-lg font-medium tracking-wide">{number}</span>
        </p>

        {(emailed || texted) && (
          <ul className="mt-5 space-y-2 text-left text-sm text-muted">
            {emailed && (
              <li className="flex items-start gap-2.5">
                <Mail size={16} strokeWidth={1.4} className="mt-0.5 shrink-0 text-accent" />
                <span>
                  A confirmation email is on its way to <span className="text-fg [overflow-wrap:anywhere]">{email}</span>
                </span>
              </li>
            )}
            {texted && (
              <li className="flex items-start gap-2.5">
                <MessageSquare size={16} strokeWidth={1.4} className="mt-0.5 shrink-0 text-accent" />
                <span>
                  A text message is on its way to <span className="text-fg">{phone}</span>
                </span>
              </li>
            )}
          </ul>
        )}

        <div className="mt-8 grid gap-2.5">
          <button type="button" onClick={close} autoFocus className="btn btn-primary btn-block">
            {copy.primary}
          </button>
          <Link href={copy.secondary.href} onClick={close} className="btn btn-outline btn-block">
            {copy.secondary.label}
          </Link>
        </div>
      </div>
    </div>
  );
}
