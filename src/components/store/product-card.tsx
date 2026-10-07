"use client";

import { Heart } from "lucide-react";
import Link from "next/link";
import type { ProductCardData } from "@/lib/data";
import { cn, percentOff } from "@/lib/utils";
import { useCart, useMoney, useSite } from "./providers";
import { Picture } from "./ui";

export function WishButton({ productId, className }: { productId: string; className?: string }) {
  const { wishlist, toggleWish, ready } = useCart();
  const active = ready && wishlist.includes(productId);
  return (
    <button
      type="button"
      aria-label={active ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={active}
      onClick={(event) => {
        event.preventDefault();
        toggleWish(productId);
      }}
      className={cn("flex h-9 w-9 items-center justify-center transition-colors hover:text-accent", className)}
    >
      <Heart size={18} strokeWidth={1.5} className={cn(active && "fill-current text-accent")} />
    </button>
  );
}

export function ProductCard({ product, eager = false }: { product: ProductCardData; eager?: boolean }) {
  const { card } = useSite();
  const { add } = useCart();
  const money = useMoney();
  const off = percentOff(product.price, product.compareAtPrice);
  const href = `/product/${product.slug}`;
  const second = card.cardHoverImage ? product.images[1] : undefined;

  function quickAdd(size: string) {
    const variant = product.variants.find((v) => v.size === size && v.stock > 0);
    if (!variant) return;
    add({
      variantId: variant.id,
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.images[0] ?? "",
      size: variant.size,
      color: variant.color,
      price: product.price,
      qty: 1,
      stock: variant.stock,
    });
  }

  return (
    <article className={cn("group relative flex flex-col", card.cardAlign === "center" && "text-center")}>
      <div
        className="relative overflow-hidden bg-surface"
        style={{ aspectRatio: "var(--card-aspect)", borderRadius: "var(--radius)" }}
      >
        <Link href={href} aria-label={product.name} className="block h-full w-full">
          <Picture
            src={product.images[0]}
            alt={product.name}
            width={700}
            eager={eager}
            className={cn("transition-all duration-700 ease-out group-hover:scale-[1.03]", second && "group-hover:opacity-0")}
          />
          {second && (
            <Picture
              src={second}
              alt=""
              width={700}
              className="absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100"
            />
          )}
        </Link>

        <div className="pointer-events-none absolute left-2.5 top-2.5 flex flex-col items-start gap-1.5">
          {!product.inStock && (
            <span className="bg-bg px-2 py-1 text-[0.62rem] font-medium uppercase tracking-[0.14em] text-fg">Sold out</span>
          )}
          {product.inStock && off > 0 && (
            <span className="bg-accent px-2 py-1 text-[0.62rem] font-medium uppercase tracking-[0.14em] text-accent-fg">
              −{off}%
            </span>
          )}
          {product.inStock && product.isNew && (
            <span className="bg-bg px-2 py-1 text-[0.62rem] font-medium uppercase tracking-[0.14em] text-fg">New</span>
          )}
        </div>

        <WishButton
          productId={product.id}
          className="absolute right-1.5 top-1.5 rounded-full bg-bg/80 text-fg backdrop-blur-sm"
        />

        {card.cardQuickAdd && product.inStock && product.sizes.length > 0 && (
          <div className="absolute inset-x-0 bottom-0 hidden translate-y-full bg-bg/95 p-3 backdrop-blur-sm transition-transform duration-300 group-focus-within:translate-y-0 group-hover:translate-y-0 lg:block">
            <p className="mb-2 text-center text-[0.62rem] font-medium uppercase tracking-[0.16em] text-muted">Quick add</p>
            <div className="flex flex-wrap justify-center gap-1.5">
              {product.sizes.map((size) => {
                const available = product.variants.some((v) => v.size === size && v.stock > 0);
                return (
                  <button
                    key={size}
                    type="button"
                    disabled={!available}
                    onClick={() => quickAdd(size)}
                    aria-label={`Add size ${size} to bag`}
                    className="min-w-9 border border-line px-2 py-1.5 text-xs text-fg transition-colors hover:border-fg hover:bg-fg hover:text-bg disabled:text-muted disabled:line-through disabled:opacity-50 disabled:hover:border-line disabled:hover:bg-transparent disabled:hover:text-muted"
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="mt-3.5 flex flex-1 flex-col gap-1">
        {product.categoryName && (
          <p className="text-[0.66rem] uppercase tracking-[0.16em] text-muted">{product.categoryName}</p>
        )}
        <h3 className="!font-body text-[0.95rem] !font-normal !normal-case leading-snug !tracking-normal">
          <Link href={href} className="transition-colors hover:text-accent">
            {product.name}
          </Link>
        </h3>
        <p className={cn("flex flex-wrap items-baseline gap-2 text-sm tabular-nums", card.cardAlign === "center" && "justify-center")}>
          <span className={cn(off > 0 && "text-accent")}>{money(product.price)}</span>
          {off > 0 && product.compareAtPrice && <s className="text-xs text-muted">{money(product.compareAtPrice)}</s>}
        </p>
        {card.cardSwatches && product.colors.length > 1 && (
          <div className={cn("mt-1.5 flex gap-1.5", card.cardAlign === "center" && "justify-center")}>
            {product.colors.slice(0, 5).map((color) => (
              <span
                key={color.name}
                title={color.name}
                className="h-3 w-3 rounded-full border border-black/10"
                style={{ background: color.hex }}
              />
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

export function ProductGrid({ products }: { products: ProductCardData[] }) {
  return (
    <div className="product-grid">
      {products.map((product, index) => (
        <ProductCard key={product.id} product={product} eager={index < 4} />
      ))}
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="product-grid" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <div key={i}>
          <div className="skeleton" style={{ aspectRatio: "var(--card-aspect)" }} />
          <div className="skeleton mt-4 h-3 w-2/3" />
          <div className="skeleton mt-2 h-3 w-1/3" />
        </div>
      ))}
    </div>
  );
}
