"use client";

import { createContext, useCallback, useContext, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import type { CartLine, CommerceSettings, ThemeSettings } from "@/lib/types";
import { formatMoney } from "@/lib/utils";

/* ─── Site settings available to client components ─────────────────────── */

export type SiteContextValue = {
  storeName: string;
  whatsapp: string;
  commerce: Pick<
    CommerceSettings,
    "currency" | "locale" | "shippingFlat" | "freeShippingAbove" | "taxRate" | "taxInclusive" | "deliveryNote" | "returnsNote"
  >;
  card: Pick<ThemeSettings, "cardAlign" | "cardQuickAdd" | "cardHoverImage" | "cardSwatches">;
};

const SiteContext = createContext<SiteContextValue | null>(null);

export function useSite() {
  const value = useContext(SiteContext);
  if (!value) throw new Error("useSite must be used inside <StoreProviders>");
  return value;
}

export function useMoney() {
  const { commerce } = useSite();
  return useCallback((amount: number) => formatMoney(amount, commerce.currency, commerce.locale), [commerce]);
}

export function Money({ amount, className }: { amount: number; className?: string }) {
  const money = useMoney();
  return <span className={className}>{money(amount)}</span>;
}

/* ─── Browser storage as an external store ─────────────────────────────── */

/**
 * A tiny localStorage-backed store for useSyncExternalStore. The server (and the first client
 * render) sees `fallback`, so hydration always matches; the saved value appears right after.
 */
function createStorageStore<T>(key: string, fallback: T, clean: (value: unknown) => T) {
  const listeners = new Set<() => void>();
  let cachedRaw: string | null | undefined;
  let cachedValue: T = fallback;
  let memory: T | null = null; // used when storage is unavailable (e.g. private mode)

  const emit = () => listeners.forEach((listener) => listener());

  function getSnapshot(): T {
    if (memory !== null) return memory;
    let raw: string | null;
    try {
      raw = window.localStorage.getItem(key);
    } catch {
      return cachedValue;
    }
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      try {
        cachedValue = raw ? clean(JSON.parse(raw)) : fallback;
      } catch {
        cachedValue = fallback;
      }
    }
    return cachedValue;
  }

  function set(next: T) {
    try {
      window.localStorage.setItem(key, JSON.stringify(next));
    } catch {
      memory = next;
    }
    emit();
  }

  function subscribe(listener: () => void) {
    // Keep several open tabs in sync.
    const onStorage = (event: StorageEvent) => {
      if (event.key === key || event.key === null) listener();
    };
    listeners.add(listener);
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  }

  return { subscribe, getSnapshot, getServerSnapshot: () => fallback, set };
}

const NO_LINES: CartLine[] = [];
const NO_IDS: string[] = [];

const cartStore = createStorageStore<CartLine[]>("atelier.cart.v1", NO_LINES, (value) =>
  Array.isArray(value) ? (value as CartLine[]).filter((l) => l && typeof l.variantId === "string" && l.qty > 0) : NO_LINES,
);
const wishStore = createStorageStore<string[]>("atelier.wishlist.v1", NO_IDS, (value) =>
  Array.isArray(value) ? (value as unknown[]).filter((id): id is string => typeof id === "string") : NO_IDS,
);

const subscribeNever = () => () => {};

/** False on the server and during hydration, true afterwards. */
export function useIsClient() {
  return useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );
}

/* ─── Cart & wishlist ──────────────────────────────────────────────────── */

type CartContextValue = {
  ready: boolean;
  lines: CartLine[];
  count: number;
  subtotal: number;
  add: (line: CartLine) => void;
  setQty: (variantId: string, qty: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  wishlist: string[];
  toggleWish: (productId: string) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside <StoreProviders>");
  return value;
}

export function StoreProviders({ site, children }: { site: SiteContextValue; children: ReactNode }) {
  const ready = useIsClient();
  const lines = useSyncExternalStore(cartStore.subscribe, cartStore.getSnapshot, cartStore.getServerSnapshot);
  const wishlist = useSyncExternalStore(wishStore.subscribe, wishStore.getSnapshot, wishStore.getServerSnapshot);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const add = useCallback((line: CartLine) => {
    const current = cartStore.getSnapshot();
    const limit = Math.max(line.stock, 1);
    const existing = current.find((l) => l.variantId === line.variantId);
    cartStore.set(
      existing
        ? current.map((l) => (l.variantId === line.variantId ? { ...l, ...line, qty: Math.min(l.qty + line.qty, limit) } : l))
        : [...current, { ...line, qty: Math.min(line.qty, limit) }],
    );
    setDrawerOpen(true);
  }, []);

  const setQty = useCallback((variantId: string, qty: number) => {
    const current = cartStore.getSnapshot();
    cartStore.set(
      qty <= 0
        ? current.filter((l) => l.variantId !== variantId)
        : current.map((l) => (l.variantId === variantId ? { ...l, qty: Math.min(qty, Math.max(l.stock, 1)) } : l)),
    );
  }, []);

  const remove = useCallback((variantId: string) => {
    cartStore.set(cartStore.getSnapshot().filter((l) => l.variantId !== variantId));
  }, []);

  const clear = useCallback(() => cartStore.set([]), []);

  const toggleWish = useCallback((productId: string) => {
    const current = wishStore.getSnapshot();
    wishStore.set(current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId]);
  }, []);

  const cart = useMemo<CartContextValue>(
    () => ({
      ready,
      lines,
      count: lines.reduce((sum, l) => sum + l.qty, 0),
      subtotal: lines.reduce((sum, l) => sum + l.price * l.qty, 0),
      add,
      setQty,
      remove,
      clear,
      drawerOpen,
      setDrawerOpen,
      wishlist,
      toggleWish,
    }),
    [ready, lines, add, setQty, remove, clear, drawerOpen, wishlist, toggleWish],
  );

  return (
    <SiteContext.Provider value={site}>
      <CartContext.Provider value={cart}>{children}</CartContext.Provider>
    </SiteContext.Provider>
  );
}
