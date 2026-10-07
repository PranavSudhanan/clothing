"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { wishlistProductsAction } from "@/lib/actions/store";
import type { ProductCardData } from "@/lib/data";
import { computeTotals } from "@/lib/pricing";
import { CartLineRow, FreeShippingBar } from "./cart-drawer";
import { ProductGrid, ProductGridSkeleton } from "./product-card";
import { useCart, useMoney, useSite } from "./providers";
import { EmptyState } from "./ui";

export function CartView() {
  const { lines, ready } = useCart();
  const { commerce } = useSite();
  const money = useMoney();
  const totals = computeTotals(lines, commerce);

  if (!ready) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-28" />
        <div className="skeleton h-28" />
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <EmptyState
        title="Your bag is empty"
        text="When you add something, it will wait for you here."
        action={
          <Link href="/shop" className="btn btn-primary">
            Start shopping
          </Link>
        }
      />
    );
  }

  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-16">
      <div>
        <FreeShippingBar subtotal={totals.subtotal} />
        <ul className="mt-4 divide-y divide-line border-y border-line">
          {lines.map((line) => (
            <CartLineRow key={line.variantId} line={line} />
          ))}
        </ul>
        <Link href="/shop" className="link-underline mt-8">
          Continue shopping
        </Link>
      </div>

      <aside className="h-fit border border-line p-6 md:p-8 lg:sticky lg:top-28" style={{ borderRadius: "var(--radius)" }}>
        <h2 className="text-2xl">Order summary</h2>
        <dl className="mt-6 space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Subtotal</dt>
            <dd className="tabular-nums">{money(totals.subtotal)}</dd>
          </div>
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
          <div className="flex justify-between border-t border-line pt-4 text-base">
            <dt>Estimated total</dt>
            <dd className="font-medium tabular-nums">{money(totals.total)}</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-muted">
          {commerce.taxInclusive ? "Prices include all taxes." : "Tax is added at checkout."} Have a coupon? Apply it at checkout.
        </p>
        <Link href="/checkout" className="btn btn-primary btn-block mt-6">
          Proceed to checkout
        </Link>
      </aside>
    </div>
  );
}

export function WishlistView() {
  const { wishlist, ready } = useCart();
  const [products, setProducts] = useState<ProductCardData[] | null>(null);
  const key = wishlist.join(",");

  useEffect(() => {
    if (!ready || key === "") return;
    let cancelled = false;
    wishlistProductsAction(key.split(",")).then((items) => {
      if (!cancelled) setProducts(items);
    });
    return () => {
      cancelled = true;
    };
  }, [ready, key]);

  if (!ready || (wishlist.length > 0 && products === null)) return <ProductGridSkeleton count={4} />;

  const visible = (products ?? []).filter((p) => wishlist.includes(p.id));
  if (visible.length === 0) {
    return (
      <EmptyState
        title="Nothing saved yet"
        text="Tap the heart on any piece to keep it here for later."
        action={
          <Link href="/shop" className="btn btn-primary">
            Browse the collection
          </Link>
        }
      />
    );
  }
  return <ProductGrid products={visible} />;
}
