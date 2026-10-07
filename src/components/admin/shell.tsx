"use client";

import {
  Boxes,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Images,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Navigation,
  Palette,
  Ruler,
  Scissors,
  Settings,
  ShoppingBag,
  SwatchBook,
  Tags,
  Ticket,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useSelectedLayoutSegments } from "next/navigation";
import { useState, type ReactNode } from "react";
import { logoutAction } from "@/lib/actions/store";
import { cn } from "@/lib/utils";
import { ToastProvider } from "./ui";

type Item = { href: string; label: string; icon: LucideIcon };

const NAV: { title?: string; items: Item[] }[] = [
  { items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard }] },
  {
    title: "Sales",
    items: [
      { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
      { href: "/admin/couture-orders", label: "Couture orders", icon: Ruler },
      { href: "/admin/customers", label: "Customers", icon: Users },
      { href: "/admin/coupons", label: "Coupons", icon: Ticket },
      { href: "/admin/inbox", label: "Inbox", icon: Inbox },
    ],
  },
  {
    title: "Ready-to-wear",
    items: [
      { href: "/admin/products", label: "Products", icon: Boxes },
      { href: "/admin/categories", label: "Categories", icon: Tags },
    ],
  },
  {
    title: "Couture",
    items: [
      { href: "/admin/couture-services", label: "Services", icon: Scissors },
      { href: "/admin/fabrics", label: "Fabrics", icon: SwatchBook },
    ],
  },
  {
    title: "Storefront",
    items: [
      { href: "/admin/pages", label: "Pages & layout", icon: FileText },
      { href: "/admin/banners", label: "Banners", icon: ImageIcon },
      { href: "/admin/theme", label: "Theme", icon: Palette },
      { href: "/admin/navigation", label: "Navigation", icon: Navigation },
      { href: "/admin/media", label: "Media", icon: Images },
    ],
  },
  { items: [{ href: "/admin/settings", label: "Settings", icon: Settings }] },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  // Segments below /admin/(panel): [] on the dashboard, ["orders", "<id>"] on an order, …
  const segments = useSelectedLayoutSegments();
  const current = segments[0] ? `/admin/${segments[0]}` : "/admin";

  return (
    <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4" aria-label="Admin">
      {NAV.map((group, i) => (
        <div key={group.title ?? i}>
          {group.title && <p className="mb-1.5 px-2.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">{group.title}</p>}
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = item.href === current;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13.5px] font-medium transition-colors",
                      active ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
                    )}
                  >
                    <item.icon size={16} strokeWidth={1.8} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function AdminShell({ storeName, userName, children }: { storeName: string; userName: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);

  const brand = (
    <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-zinc-200 px-5">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 text-[13px] font-semibold text-white">
        {storeName.slice(0, 1).toUpperCase()}
      </span>
      <span className="truncate text-[14px] font-semibold">{storeName}</span>
    </div>
  );

  const footer = (
    <div className="shrink-0 border-t border-zinc-200 p-3">
      <a
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13.5px] font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
      >
        <ExternalLink size={16} strokeWidth={1.8} /> View storefront
      </a>
      <form action={logoutAction}>
        <button
          type="submit"
          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-left text-[13.5px] font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
        >
          <LogOut size={16} strokeWidth={1.8} /> Sign out
          <span className="ml-auto max-w-[6.5rem] truncate text-xs font-normal text-zinc-400">{userName}</span>
        </button>
      </form>
    </div>
  );

  return (
    <ToastProvider>
      <div className="admin lg:pl-60">
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-zinc-200 bg-white lg:flex">
          {brand}
          <NavLinks />
          {footer}
        </aside>

        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-zinc-200 bg-white px-4 lg:hidden">
          <button type="button" aria-label="Open menu" onClick={() => setOpen(true)} className="a-btn a-btn-ghost a-btn-icon">
            <Menu size={20} />
          </button>
          <span className="text-[14px] font-semibold">{storeName} admin</span>
          <a href="/" target="_blank" rel="noopener noreferrer" aria-label="View storefront" className="a-btn a-btn-ghost a-btn-icon">
            <ExternalLink size={18} />
          </a>
        </header>

        {open && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button type="button" aria-label="Close menu" className="animate-fade-in absolute inset-0 bg-zinc-900/40" onClick={() => setOpen(false)} />
            <aside className="animate-slide-left absolute inset-y-0 left-0 flex w-64 flex-col bg-white">
              <div className="relative">
                {brand}
                <button type="button" aria-label="Close menu" onClick={() => setOpen(false)} className="a-btn a-btn-ghost a-btn-icon absolute right-3 top-3">
                  <X size={18} />
                </button>
              </div>
              <NavLinks onNavigate={() => setOpen(false)} />
              {footer}
            </aside>
          </div>
        )}

        <main className="mx-auto w-full max-w-[1200px] px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </ToastProvider>
  );
}
