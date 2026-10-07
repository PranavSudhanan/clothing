import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountView, type AccountData } from "@/components/store/account-forms";
import { requireUser } from "@/lib/auth";
import { getSiteConfig } from "@/lib/data";
import { shippingCountries } from "@/lib/geo";
import { getCoutureOrdersForUser, getOrdersForUser } from "@/lib/orders";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "My account", robots: { index: false } };

async function Account() {
  const user = await requireUser("/account");
  const [orders, couture, config] = await Promise.all([getOrdersForUser(user.id), getCoutureOrdersForUser(user.id), getSiteConfig()]);

  const data: AccountData = {
    countries: shippingCountries(config.commerce.shippingCountries),
    user: { name: user.name, email: user.email, phone: user.phone, addresses: user.addresses, measurements: user.measurements },
    orders: orders.map((order) => ({
      number: order.number,
      token: order.token,
      date: formatDate(order.createdAt),
      status: order.status,
      total: order.total,
      items: order.items.reduce((sum, item) => sum + item.qty, 0),
      image: order.items[0]?.image ?? "",
    })),
    couture: couture.map((order) => ({
      number: order.number,
      token: order.token,
      date: formatDate(order.createdAt),
      status: order.status,
      service: order.serviceName,
      price: order.finalPrice ?? order.estimatedPrice,
    })),
  };

  return <AccountView data={data} />;
}

export default function AccountPage() {
  return (
    <div className="container-page py-10 md:py-16">
      <Suspense
        fallback={
          <div className="space-y-6">
            <div className="skeleton h-14 w-72" />
            <div className="skeleton h-64" />
          </div>
        }
      >
        <Account />
      </Suspense>
    </div>
  );
}
