"use client";

import { ChevronDown, Heart, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import type { NavItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useCart } from "./providers";
import { SmartLink } from "./ui";

type HeaderProps = {
  storeName: string;
  logoUrl: string;
  logoHeight: number;
  nav: NavItem[];
  layout: "left" | "center";
  sticky: boolean;
  showSearch: boolean;
  showWishlist: boolean;
};

export function Announcement({ messages }: { messages: { text: string; href?: string }[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (messages.length < 2) return;
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % messages.length), 4500);
    return () => window.clearInterval(timer);
  }, [messages.length]);

  if (messages.length === 0) return null;
  const message = messages[index % messages.length];

  return (
    <div
      className="flex min-h-9 items-center justify-center px-4 py-2 text-center text-[0.72rem] font-medium uppercase tracking-[0.16em]"
      style={{ background: "var(--t-announce-bg)", color: "var(--t-announce-fg)" }}
    >
      <span key={index} className="animate-fade-in">
        {message.href ? (
          <SmartLink href={message.href} className="underline-offset-4 hover:underline">
            {message.text}
          </SmartLink>
        ) : (
          message.text
        )}
      </span>
    </div>
  );
}

function Logo({ storeName, logoUrl, logoHeight }: Pick<HeaderProps, "storeName" | "logoUrl" | "logoHeight">) {
  return (
    <Link href="/" aria-label={`${storeName} — home`} className="flex items-center">
      {logoUrl ? (
        <img src={logoUrl} alt={storeName} style={{ height: Math.min(Math.max(logoHeight, 16), 72) }} className="w-auto" />
      ) : (
        <span className="heading text-[1.7rem] leading-none tracking-[0.08em]">{storeName}</span>
      )}
    </Link>
  );
}

export function Header({ storeName, logoUrl, logoHeight, nav, layout, sticky, showSearch, showWishlist }: HeaderProps) {
  const router = useRouter();
  const { count, ready, setDrawerOpen, wishlist } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [dropdown, setDropdown] = useState<string | null>(null);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const q = String(new FormData(event.currentTarget).get("q") ?? "").trim();
    setSearchOpen(false);
    router.push(q ? `/shop?q=${encodeURIComponent(q)}` : "/shop");
  }

  // Closing on click needs state: with CSS-only hover/focus the menu stays open after a
  // client-side navigation, because the pointer is still over it and the link keeps focus.
  function closeDropdown() {
    setDropdown(null);
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  }

  const desktopNav = (
    <nav className="hidden items-center gap-8 lg:flex" aria-label="Main">
      {nav.map((item) => {
        const key = item.label + item.href;
        const hasChildren = Boolean(item.children?.length);
        const open = hasChildren && dropdown === key;
        return (
          <div
            key={key}
            className="relative"
            onMouseEnter={() => setDropdown(key)}
            onMouseLeave={() => setDropdown(null)}
            onFocus={() => setDropdown(key)}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) setDropdown((current) => (current === key ? null : current));
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") closeDropdown();
            }}
          >
            <SmartLink
              href={item.href}
              onClick={closeDropdown}
              aria-haspopup={hasChildren ? "true" : undefined}
              aria-expanded={hasChildren ? open : undefined}
              className="flex h-[4.5rem] items-center gap-1 text-[0.78rem] font-medium uppercase tracking-[0.14em] transition-colors hover:text-accent"
            >
              {item.label}
              {hasChildren && (
                <ChevronDown size={13} strokeWidth={1.5} className={cn("transition-transform duration-200", open && "rotate-180")} />
              )}
            </SmartLink>
            {hasChildren && (
              <div
                className={cn(
                  "absolute left-1/2 top-full z-50 w-60 -translate-x-1/2 border border-line bg-bg p-2 shadow-xl shadow-black/5 transition-all duration-200",
                  open ? "visible translate-y-0 opacity-100" : "invisible translate-y-1 opacity-0",
                )}
              >
                {item.children!.map((child) => (
                  <SmartLink
                    key={child.label + child.href}
                    href={child.href}
                    onClick={closeDropdown}
                    className="block px-3 py-2.5 text-sm text-muted transition-colors hover:bg-surface hover:text-fg"
                  >
                    {child.label}
                  </SmartLink>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );

  const icons = (
    <div className="flex items-center justify-end gap-1 sm:gap-2">
      {showSearch && (
        <button
          type="button"
          aria-label="Search"
          onClick={() => setSearchOpen((open) => !open)}
          className="flex h-10 w-10 items-center justify-center transition-colors hover:text-accent"
        >
          <Search size={20} strokeWidth={1.4} />
        </button>
      )}
      <Link
        href="/account"
        aria-label="Account"
        className="hidden h-10 w-10 items-center justify-center transition-colors hover:text-accent sm:flex"
      >
        <User size={20} strokeWidth={1.4} />
      </Link>
      {showWishlist && (
        <Link
          href="/wishlist"
          aria-label="Wishlist"
          className="relative hidden h-10 w-10 items-center justify-center transition-colors hover:text-accent sm:flex"
        >
          <Heart size={20} strokeWidth={1.4} />
          {ready && wishlist.length > 0 && <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-accent" />}
        </Link>
      )}
      <button
        type="button"
        aria-label={`Cart, ${count} items`}
        onClick={() => setDrawerOpen(true)}
        className="relative flex h-10 w-10 items-center justify-center transition-colors hover:text-accent"
      >
        <ShoppingBag size={20} strokeWidth={1.4} />
        {ready && count > 0 && (
          <span className="absolute -right-0.5 top-0.5 flex h-[1.1rem] min-w-[1.1rem] items-center justify-center rounded-full bg-primary px-1 text-[0.62rem] font-semibold text-primary-fg">
            {count}
          </span>
        )}
      </button>
    </div>
  );

  return (
    <>
      <header className={cn("z-40 border-b border-line bg-bg/95 backdrop-blur-md", sticky && "sticky top-0")}>
        <div className="container-page relative grid h-[4.5rem] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4 lg:flex lg:justify-between">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setMenuOpen(true)}
            className="-ml-2 flex h-10 w-10 items-center justify-center lg:hidden"
          >
            <Menu size={22} strokeWidth={1.4} />
          </button>

          {layout === "center" ? (
            <>
              <div className="hidden flex-1 lg:block">{desktopNav}</div>
              <div className="lg:absolute lg:left-1/2 lg:-translate-x-1/2">
                <Logo storeName={storeName} logoUrl={logoUrl} logoHeight={logoHeight} />
              </div>
              <div className="lg:flex-1">{icons}</div>
            </>
          ) : (
            <>
              <div className="lg:flex-1">
                <Logo storeName={storeName} logoUrl={logoUrl} logoHeight={logoHeight} />
              </div>
              {desktopNav}
              <div className="lg:flex-1">{icons}</div>
            </>
          )}
        </div>

        {searchOpen && (
          <div className="animate-fade-in absolute inset-x-0 top-full border-b border-line bg-bg shadow-lg shadow-black/5">
            <form onSubmit={onSearch} className="container-page flex items-center gap-3 py-4">
              <Search size={20} strokeWidth={1.4} className="shrink-0 text-muted" />
              <input
                name="q"
                autoFocus
                placeholder="Search shirts, suits, linen…"
                aria-label="Search products"
                className="h-11 flex-1 bg-transparent text-lg outline-none placeholder:text-muted/70"
              />
              <button type="submit" className="btn btn-primary btn-sm">
                Search
              </button>
              <button type="button" aria-label="Close search" onClick={() => setSearchOpen(false)} className="p-2">
                <X size={20} strokeWidth={1.4} />
              </button>
            </form>
          </div>
        )}
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="animate-fade-in absolute inset-0 bg-black/45"
            onClick={() => setMenuOpen(false)}
          />
          <div className="animate-slide-left absolute inset-y-0 left-0 flex w-[86%] max-w-sm flex-col bg-bg">
            <div className="flex h-[4.5rem] items-center justify-between border-b border-line px-5">
              <span className="heading text-2xl tracking-[0.08em]">{storeName}</span>
              <button type="button" aria-label="Close menu" onClick={() => setMenuOpen(false)} className="p-2">
                <X size={22} strokeWidth={1.4} />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-5 py-3" aria-label="Mobile">
              {nav.map((item) => {
                const key = item.label + item.href;
                const hasChildren = Boolean(item.children?.length);
                return (
                  <div key={key} className="border-b border-line">
                    <div className="flex items-center justify-between">
                      <SmartLink
                        href={item.href}
                        onClick={() => setMenuOpen(false)}
                        className="flex-1 py-4 text-sm font-medium uppercase tracking-[0.14em]"
                      >
                        {item.label}
                      </SmartLink>
                      {hasChildren && (
                        <button
                          type="button"
                          aria-label={`Toggle ${item.label}`}
                          onClick={() => setExpanded(expanded === key ? null : key)}
                          className="p-3"
                        >
                          <ChevronDown
                            size={16}
                            strokeWidth={1.5}
                            className={cn("transition-transform", expanded === key && "rotate-180")}
                          />
                        </button>
                      )}
                    </div>
                    {hasChildren && expanded === key && (
                      <div className="pb-3">
                        {item.children!.map((child) => (
                          <SmartLink
                            key={child.label + child.href}
                            href={child.href}
                            onClick={() => setMenuOpen(false)}
                            className="block py-2.5 pl-3 text-sm text-muted"
                          >
                            {child.label}
                          </SmartLink>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
            <div className="grid grid-cols-3 border-t border-line text-center text-xs uppercase tracking-[0.12em]">
              <Link href="/account" onClick={() => setMenuOpen(false)} className="py-4">
                Account
              </Link>
              <Link href="/wishlist" onClick={() => setMenuOpen(false)} className="border-x border-line py-4">
                Wishlist
              </Link>
              <Link href="/track" onClick={() => setMenuOpen(false)} className="py-4">
                Track order
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
