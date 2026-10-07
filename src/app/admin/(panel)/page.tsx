import { Banknote, Inbox, Ruler, ShoppingBag, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Card, PageHeader } from "@/components/admin/ui";
import { adminDashboard } from "@/lib/admin-data";
import { COUTURE_STATUS_LABELS, type CoutureStatus } from "@/lib/types";
import { formatDate, formatMoney, statusTone } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };
export const instant = false;

export default async function DashboardPage() {
  const data = await adminDashboard();
  const { currency, locale } = data.config.commerce;
  const money = (amount: number) => formatMoney(amount, currency, locale);
  const peak = Math.max(...data.chart.map((d) => d.revenue), 1);

  const stats = [
    { label: "Revenue · 30 days", value: money(data.revenue), icon: Banknote, href: "/admin/orders" },
    { label: "Orders · 30 days", value: String(data.orderCount), icon: ShoppingBag, href: "/admin/orders" },
    { label: "Orders to fulfil", value: String(data.pending), icon: ShoppingBag, href: "/admin/orders?status=pending" },
    { label: "Couture in progress", value: String(data.openCouture), icon: Ruler, href: "/admin/couture-orders" },
    { label: "Customers", value: String(data.customers), icon: Users, href: "/admin/customers" },
    { label: "Unread messages", value: String(data.unread), icon: Inbox, href: "/admin/inbox" },
  ];

  return (
    <>
      <PageHeader title="Dashboard" description={`What is happening at ${data.config.general.storeName} right now.`} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href} className="a-card group p-4 transition hover:border-zinc-300 hover:shadow-sm md:p-5">
            <div className="flex items-center justify-between text-zinc-500">
              <span className="text-[13px]">{stat.label}</span>
              <stat.icon size={16} strokeWidth={1.7} />
            </div>
            <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{stat.value}</p>
          </Link>
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Card title="Sales · last 14 days" className="lg:col-span-2">
          <div className="flex h-40 items-end gap-1.5" role="img" aria-label="Daily revenue for the last 14 days">
            {data.chart.map((day) => (
              <div key={day.day} className="group relative flex h-full flex-1 flex-col justify-end">
                <div
                  className="w-full rounded-t bg-zinc-900 transition-colors group-hover:bg-zinc-600"
                  style={{ height: `${Math.max((day.revenue / peak) * 100, day.revenue > 0 ? 4 : 1.5)}%`, opacity: day.revenue > 0 ? 1 : 0.15 }}
                />
                <span className="pointer-events-none absolute -top-1 left-1/2 z-10 hidden -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-zinc-900 px-2 py-1 text-xs text-white group-hover:block">
                  {day.day.slice(5)} · {money(day.revenue)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-xs text-zinc-400">
            <span>{data.chart[0]?.day.slice(5)}</span>
            <span>Today</span>
          </div>
        </Card>

        <Card title="Low stock" description={`At or below ${data.config.commerce.lowStockThreshold} units`}>
          {data.lowStock.length === 0 ? (
            <p className="text-[13.5px] text-zinc-500">Everything is well stocked.</p>
          ) : (
            <ul className="-my-1 divide-y divide-zinc-100">
              {data.lowStock.map((item) => (
                <li key={item.id}>
                  <Link href={`/admin/products/${item.productId}`} className="flex items-center justify-between gap-3 py-2 text-[13.5px] hover:text-zinc-600">
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{item.name}</span>
                      <span className="text-xs text-zinc-500">{[item.color, item.size].filter(Boolean).join(" · ")}</span>
                    </span>
                    <Badge tone={item.stock === 0 ? "bad" : "warn"}>{item.stock === 0 ? "Sold out" : `${item.stock} left`}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card
          title="Recent orders"
          actions={
            <Link href="/admin/orders" className="text-[13px] font-medium text-zinc-600 hover:text-zinc-900">
              View all
            </Link>
          }
        >
          {data.recentOrders.length === 0 ? (
            <p className="text-[13.5px] text-zinc-500">No orders yet. They will appear here as soon as customers check out.</p>
          ) : (
            <ul className="-my-1 divide-y divide-zinc-100">
              {data.recentOrders.map((order) => (
                <li key={order.id}>
                  <Link href={`/admin/orders/${order.id}`} className="flex items-center justify-between gap-3 py-2.5 text-[13.5px] hover:text-zinc-600">
                    <span className="min-w-0">
                      <span className="block font-medium">{order.number}</span>
                      <span className="block truncate text-xs text-zinc-500">
                        {order.name} · {formatDate(order.createdAt)}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-3">
                      <span className="tabular-nums">{money(order.total)}</span>
                      <Badge tone={statusTone(order.status)}>{order.status}</Badge>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card
          title="Recent couture requests"
          actions={
            <Link href="/admin/couture-orders" className="text-[13px] font-medium text-zinc-600 hover:text-zinc-900">
              View all
            </Link>
          }
        >
          {data.recentCouture.length === 0 ? (
            <p className="text-[13.5px] text-zinc-500">No couture requests yet.</p>
          ) : (
            <ul className="-my-1 divide-y divide-zinc-100">
              {data.recentCouture.map((order) => (
                <li key={order.id}>
                  <Link href={`/admin/couture-orders/${order.id}`} className="flex items-center justify-between gap-3 py-2.5 text-[13.5px] hover:text-zinc-600">
                    <span className="min-w-0">
                      <span className="block font-medium">{order.serviceName}</span>
                      <span className="block truncate text-xs text-zinc-500">
                        {order.name} · {order.number}
                      </span>
                    </span>
                    <Badge tone={statusTone(order.status)}>{COUTURE_STATUS_LABELS[order.status as CoutureStatus] ?? order.status}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
