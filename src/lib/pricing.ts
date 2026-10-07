import type { CommerceSettings } from "./types";
import { round2 } from "./utils";

export type CouponRule = {
  code: string;
  type: "percent" | "fixed";
  value: number;
  minOrder: number;
  maxDiscount: number;
};

export type Totals = {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
};

export function couponDiscount(subtotal: number, coupon: CouponRule | null | undefined) {
  if (!coupon || subtotal < coupon.minOrder) return 0;
  let discount = coupon.type === "percent" ? (subtotal * coupon.value) / 100 : coupon.value;
  if (coupon.maxDiscount > 0) discount = Math.min(discount, coupon.maxDiscount);
  return round2(Math.min(discount, subtotal));
}

/** Single source of truth for order maths. Used by the cart (estimate) and by checkout (final). */
export function computeTotals(
  lines: { price: number; qty: number }[],
  commerce: Pick<CommerceSettings, "shippingFlat" | "freeShippingAbove" | "taxRate" | "taxInclusive">,
  coupon?: CouponRule | null,
): Totals {
  const subtotal = round2(lines.reduce((sum, l) => sum + l.price * l.qty, 0));
  const discount = couponDiscount(subtotal, coupon);
  const net = round2(subtotal - discount);

  let shipping = 0;
  if (lines.length > 0) {
    const free = commerce.freeShippingAbove > 0 && net >= commerce.freeShippingAbove;
    shipping = free ? 0 : commerce.shippingFlat;
  }

  const rate = Math.max(0, commerce.taxRate) / 100;
  // Inclusive tax is already part of the price, so it is reported but never added.
  const tax = round2(commerce.taxInclusive ? net - net / (1 + rate) : net * rate);
  const total = round2(net + shipping + (commerce.taxInclusive ? 0 : tax));

  return { subtotal, discount, shipping, tax, total };
}
