"use client";

import { Minus, Plus, ShoppingBag, X } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import type { CartLine } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useCart, useMoney, useSite } from "./providers";
import { Picture } from "./ui";

export function QtyStepper({
  value,
  max,
  onChange,
  small = false,
}: {
  value: number;
  max: number;
  onChange: (qty: number) => void;
  small?: boolean;
}) {
  const size = small ? "h-8 w-8" : "h-12 w-11";
  return (
    <div className="inline-flex items-center border border-line" style={{ borderRadius: "var(--radius)" }}>
      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={() => onChange(value - 1)}
        className={cn("flex items-center justify-center transition-colors hover:text-accent", size)}
      >
        <Minus size={14} strokeWidth={1.5} />
      </button>
      <span className={cn("text-center text-sm tabular-nums", small ? "w-7" : "w-9")} aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        aria-label="Increase quantity"
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
        className={cn("flex items-center justify-center transition-colors hover:text-accent disabled:opacity-30", size)}
      >
        <Plus size={14} strokeWidth={1.5} />
      </button>
    </div>
  );
}

export function CartLineRow({ line, onNavigate }: { line: CartLine; onNavigate?: () => void }) {
  const { setQty, remove } = useCart();
  const money = useMoney();
  const variant = [line.color, line.size].filter(Boolean).join(" · ");

  return (
    <li className="flex gap-4 py-5">
      <Link
        href={`/product/${line.slug}`}
        onClick={onNavigate}
        className="block w-20 shrink-0 overflow-hidden bg-surface"
        style={{ aspectRatio: "3 / 4", borderRadius: "var(--radius)" }}
      >
        <Picture src={line.image} alt={line.name} width={240} />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <Link href={`/product/${line.slug}`} onClick={onNavigate} className="text-sm font-medium leading-snug hover:text-accent">
            {line.name}
          </Link>
          <span className="shrink-0 text-sm tabular-nums">{money(line.price * line.qty)}</span>
        </div>
        {variant && <p className="mt-1 text-xs text-muted">{variant}</p>}
        <div className="mt-auto flex items-center justify-between pt-3">
          <QtyStepper small value={line.qty} max={Math.max(line.stock, 1)} onChange={(qty) => setQty(line.variantId, qty)} />
          <button
            type="button"
            onClick={() => remove(line.variantId)}
            className="text-xs uppercase tracking-[0.12em] text-muted underline-offset-4 hover:text-fg hover:underline"
          >
            Remove
          </button>
        </div>
      </div>
    </li>
  );
}

export function FreeShippingBar({ subtotal }: { subtotal: number }) {
  const { commerce } = useSite();
  const money = useMoney();
  const threshold = commerce.freeShippingAbove;
  if (!threshold || threshold <= 0) return null;
  const remaining = Math.max(threshold - subtotal, 0);
  const progress = Math.min((subtotal / threshold) * 100, 100);

  return (
    <div>
      <p className="text-xs text-muted">
        {remaining > 0 ? (
          <>
            Add <span className="font-medium text-fg">{money(remaining)}</span> more for free shipping
          </>
        ) : (
          <span className="font-medium text-fg">You have unlocked free shipping</span>
        )}
      </p>
      <div className="mt-2 h-0.5 w-full bg-line">
        <div className="h-full bg-accent transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

export function CartDrawer() {
  const { lines, subtotal, count, drawerOpen, setDrawerOpen } = useCart();
  const money = useMoney();
  const close = () => setDrawerOpen(false);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setDrawerOpen(false);
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [drawerOpen, setDrawerOpen]);

  if (!drawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Shopping cart">
      <button type="button" aria-label="Close cart" className="animate-fade-in absolute inset-0 bg-black/45" onClick={close} />
      <aside className="animate-slide-right absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-bg text-fg shadow-2xl">
        <header className="flex h-[4.5rem] shrink-0 items-center justify-between border-b border-line px-6">
          <h2 className="text-2xl">
            Your bag <span className="font-body text-sm text-muted">({count})</span>
          </h2>
          <button type="button" aria-label="Close cart" onClick={close} className="-mr-2 p-2 hover:text-accent">
            <X size={22} strokeWidth={1.4} />
          </button>
        </header>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
            <ShoppingBag size={36} strokeWidth={1} className="text-muted" />
            <p className="text-muted">Your bag is empty.</p>
            <Link href="/shop" onClick={close} className="btn btn-primary">
              Start shopping
            </Link>
          </div>
        ) : (
          <>
            <div className="border-b border-line px-6 py-4">
              <FreeShippingBar subtotal={subtotal} />
            </div>
            <ul className="flex-1 divide-y divide-line overflow-y-auto px-6">
              {lines.map((line) => (
                <CartLineRow key={line.variantId} line={line} onNavigate={close} />
              ))}
            </ul>
            <footer className="shrink-0 border-t border-line px-6 py-5">
              <div className="flex items-baseline justify-between">
                <span className="text-sm uppercase tracking-[0.14em]">Subtotal</span>
                <span className="text-lg tabular-nums">{money(subtotal)}</span>
              </div>
              <p className="mt-1 text-xs text-muted">Shipping and discounts are calculated at checkout.</p>
              <div className="mt-5 grid gap-2.5">
                <Link href="/checkout" onClick={close} className="btn btn-primary btn-block">
                  Checkout
                </Link>
                <Link href="/cart" onClick={close} className="btn btn-outline btn-block">
                  View bag
                </Link>
              </div>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
