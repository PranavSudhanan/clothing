"use client";

import { Check, Ruler, Scissors } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { ColorOption } from "@/lib/types";
import { cn, imageUrl, percentOff } from "@/lib/utils";
import { QtyStepper } from "./cart-drawer";
import { WishButton } from "./product-card";
import { useCart, useMoney } from "./providers";

export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);
  const shown = images.length > 0 ? images : [""];

  return (
    <div className="flex flex-col-reverse gap-3 md:flex-row md:gap-4">
      {shown.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto md:w-20 md:shrink-0 md:flex-col md:overflow-visible">
          {shown.map((src, i) => (
            <button
              key={src + i}
              type="button"
              aria-label={`Show image ${i + 1}`}
              aria-current={i === active}
              onClick={() => setActive(i)}
              className={cn(
                "w-16 shrink-0 overflow-hidden border bg-surface transition-colors md:w-full",
                i === active ? "border-fg" : "border-transparent hover:border-line",
              )}
              style={{ aspectRatio: "3 / 4", borderRadius: "var(--radius)" }}
            >
              <img src={imageUrl(src, 200)} alt="" className="h-full w-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      )}
      <div
        className="relative flex-1 overflow-hidden bg-surface"
        style={{ aspectRatio: "4 / 5", borderRadius: "var(--radius)" }}
      >
        {shown[active] ? (
          <img
            key={shown[active]}
            src={imageUrl(shown[active], 1400)}
            alt={name}
            fetchPriority="high"
            className="animate-fade-in h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted">No image yet</div>
        )}
      </div>
    </div>
  );
}

type PurchaseProps = {
  product: {
    id: string;
    slug: string;
    name: string;
    price: number;
    compareAtPrice: number | null;
    image: string;
    sizes: string[];
    colors: ColorOption[];
  };
  variants: { id: string; size: string; color: string; stock: number }[];
  lowStockThreshold: number;
};

export function ProductPurchase({ product, variants, lowStockThreshold }: PurchaseProps) {
  const router = useRouter();
  const { add } = useCart();
  const money = useMoney();
  const off = percentOff(product.price, product.compareAtPrice);

  const firstAvailableColor =
    product.colors.find((c) => variants.some((v) => v.color === c.name && v.stock > 0))?.name ?? product.colors[0]?.name ?? "";
  const [color, setColor] = useState(firstAvailableColor);
  const [size, setSize] = useState(product.sizes.length === 0 ? "" : "");
  const [qty, setQty] = useState(1);
  const [error, setError] = useState("");
  const [added, setAdded] = useState(false);

  const needsSize = product.sizes.length > 0;
  const stockFor = (s: string, c: string) =>
    variants.find((v) => v.size === s && (product.colors.length === 0 || v.color === c))?.stock ?? 0;
  const variant = useMemo(
    () => variants.find((v) => (!needsSize || v.size === size) && (product.colors.length === 0 || v.color === color)),
    [variants, size, color, needsSize, product.colors.length],
  );
  const soldOut = variants.every((v) => v.stock <= 0);
  const selectedStock = variant?.stock ?? 0;

  function commit(goToCheckout: boolean) {
    if (needsSize && !size) {
      setError("Please select a size.");
      return;
    }
    if (!variant || variant.stock <= 0) {
      setError("That combination is sold out.");
      return;
    }
    setError("");
    add({
      variantId: variant.id,
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.image,
      size: variant.size,
      color: variant.color,
      price: product.price,
      qty: Math.min(qty, variant.stock),
      stock: variant.stock,
    });
    if (goToCheckout) {
      router.push("/checkout");
    } else {
      setAdded(true);
      window.setTimeout(() => setAdded(false), 2000);
    }
  }

  return (
    <div>
      <p className="flex flex-wrap items-baseline gap-3 text-2xl tabular-nums">
        <span className={cn(off > 0 && "text-accent")}>{money(product.price)}</span>
        {off > 0 && product.compareAtPrice && (
          <>
            <s className="text-base text-muted">{money(product.compareAtPrice)}</s>
            <span className="bg-accent px-2 py-1 text-[0.66rem] font-medium uppercase tracking-[0.14em] text-accent-fg">
              Save {off}%
            </span>
          </>
        )}
      </p>
      <p className="mt-1 text-xs text-muted">Inclusive of all taxes</p>

      {product.colors.length > 0 && (
        <fieldset className="mt-8">
          <legend className="text-[0.72rem] font-medium uppercase tracking-[0.16em]">
            Colour <span className="ml-2 font-normal normal-case tracking-normal text-muted">{color}</span>
          </legend>
          <div className="mt-3 flex flex-wrap gap-3">
            {product.colors.map((option) => (
              <button
                key={option.name}
                type="button"
                title={option.name}
                aria-label={option.name}
                aria-pressed={option.name === color}
                onClick={() => {
                  setColor(option.name);
                  setError("");
                  if (size && stockFor(size, option.name) <= 0) setSize("");
                }}
                className={cn(
                  "h-9 w-9 rounded-full border border-black/10 outline-offset-[3px] transition-all",
                  option.name === color ? "outline outline-1 outline-fg" : "hover:outline hover:outline-1 hover:outline-line",
                )}
                style={{ background: option.hex }}
              />
            ))}
          </div>
        </fieldset>
      )}

      {needsSize && (
        <fieldset className="mt-8">
          <div className="flex items-center justify-between">
            <legend className="float-left text-[0.72rem] font-medium uppercase tracking-[0.16em]">Size</legend>
            <Link
              href="/size-guide"
              target="_blank"
              className="flex items-center gap-1.5 text-xs text-muted underline underline-offset-4 hover:text-fg"
            >
              <Ruler size={13} strokeWidth={1.5} /> Size guide
            </Link>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {product.sizes.map((option) => {
              const available = stockFor(option, color) > 0;
              return (
                <button
                  key={option}
                  type="button"
                  disabled={!available}
                  aria-pressed={option === size}
                  onClick={() => {
                    setSize(option);
                    setQty(1);
                    setError("");
                  }}
                  className={cn(
                    "min-h-11 min-w-12 border px-3 text-sm transition-colors",
                    option === size ? "border-fg bg-fg text-bg" : "border-line hover:border-fg",
                    !available && "text-muted line-through opacity-45 hover:border-line",
                  )}
                  style={{ borderRadius: "var(--radius)" }}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <div className="mt-4 min-h-5 text-sm">
        {error ? (
          <p role="alert" className="text-red-600">
            {error}
          </p>
        ) : variant && selectedStock > 0 && selectedStock <= lowStockThreshold ? (
          <p className="text-accent">Only {selectedStock} left in this size</p>
        ) : null}
      </div>

      <div className="mt-4 flex gap-3">
        <QtyStepper value={qty} max={Math.max(selectedStock, 1)} onChange={(next) => setQty(Math.max(1, next))} />
        <button type="button" disabled={soldOut} onClick={() => commit(false)} className="btn btn-primary flex-1">
          {soldOut ? (
            "Sold out"
          ) : added ? (
            <>
              <Check size={16} strokeWidth={1.8} /> Added
            </>
          ) : (
            "Add to bag"
          )}
        </button>
        <WishButton productId={product.id} className="!h-12 !w-12 shrink-0 border border-line" />
      </div>
      {!soldOut && (
        <button type="button" onClick={() => commit(true)} className="btn btn-outline btn-block mt-3">
          Buy it now
        </button>
      )}

      <Link
        href="/couture"
        className="mt-6 flex items-center gap-3 border border-line p-4 text-sm transition-colors hover:border-fg"
        style={{ borderRadius: "var(--radius)" }}
      >
        <Scissors size={20} strokeWidth={1.3} className="shrink-0 text-accent" />
        <span>
          <span className="font-medium">Between sizes?</span>{" "}
          <span className="text-muted">Have it stitched to your exact measurements by our couture workshop.</span>
        </span>
      </Link>
    </div>
  );
}
