import type { Metadata } from "next";
import { EmptyRow, PageHeader } from "@/components/admin/ui";
import { adminConfig, adminCustomers } from "@/lib/admin-data";
import { formatDate, formatMoney } from "@/lib/utils";

export const metadata: Metadata = { title: "Customers" };
export const instant = false;

export default async function CustomersPage() {
  const [customers, config] = await Promise.all([adminCustomers(), adminConfig()]);

  return (
    <>
      <PageHeader title="Customers" description="People who created an account. Guest checkouts appear under Orders only." />
      <div className="a-card overflow-hidden">
        {customers.length === 0 ? (
          <EmptyRow>No customer accounts yet.</EmptyRow>
        ) : (
          <div className="overflow-x-auto">
            <table className="a-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Orders</th>
                  <th>Couture</th>
                  <th>Total spent</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id}>
                    <td>
                      <span className="block font-medium">{customer.name}</span>
                      <a href={`mailto:${customer.email}`} className="text-xs text-zinc-500 hover:underline">
                        {customer.email}
                      </a>
                    </td>
                    <td className="text-zinc-600">{customer.phone || "—"}</td>
                    <td className="tabular-nums">{customer.orders}</td>
                    <td className="tabular-nums">{customer.couture}</td>
                    <td className="tabular-nums">{formatMoney(customer.spent, config.commerce.currency, config.commerce.locale)}</td>
                    <td className="whitespace-nowrap text-zinc-500">{formatDate(customer.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
