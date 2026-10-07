import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ListFilters } from "@/components/admin/list-filters";
import { Badge, EmptyRow, PageHeader } from "@/components/admin/ui";
import { adminConfig, adminProducts } from "@/lib/admin-data";
import { formatMoney } from "@/lib/utils";

export const metadata: Metadata = { title: "Products" };
export const instant = false;

type Props = { searchParams: Promise<{ status?: string; q?: string }> };

export default async function ProductsPage({ searchParams }: Props) {
  const params = await searchParams;
  const status = ["active", "draft", "low"].includes(params.status ?? "") ? params.status! : "";
  const q = (params.q ?? "").slice(0, 80);
  const [all, config] = await Promise.all([adminProducts(q), adminConfig()]);
  const threshold = config.commerce.lowStockThreshold;
  const rows = all.filter((p) => (status === "low" ? p.stock <= threshold : status ? p.status === status : true));
  const money = (amount: number) => formatMoney(amount, config.commerce.currency, config.commerce.locale);

  return (
    <>
      <PageHeader
        title="Products"
        description="Your ready-to-wear catalogue."
        actions={
          <Link href="/admin/products/new" className="a-btn a-btn-primary">
            <Plus size={15} /> Add product
          </Link>
        }
      />
      <div className="a-card overflow-hidden">
        <ListFilters
          basePath="/admin/products"
          status={status}
          q={q}
          placeholder="Search products…"
          tabs={[
            { value: "", label: "All", count: all.length },
            { value: "active", label: "Active", count: all.filter((p) => p.status === "active").length },
            { value: "draft", label: "Draft", count: all.filter((p) => p.status === "draft").length },
            { value: "low", label: "Low stock", count: all.filter((p) => p.stock <= threshold).length },
          ]}
        />
        {rows.length === 0 ? (
          <EmptyRow>{all.length === 0 && !q ? "No products yet. Add your first one." : "No products match this view."}</EmptyRow>
        ) : (
          <div className="overflow-x-auto">
            <table className="a-table">
              <thead>
                <tr>
                  <th className="w-14" />
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((product) => (
                  <tr key={product.id}>
                    <td>
                      {product.image ? (
                        <img src={product.image} alt="" loading="lazy" className="h-12 w-10 rounded-md border border-zinc-200 object-cover" />
                      ) : (
                        <span className="block h-12 w-10 rounded-md bg-zinc-100" />
                      )}
                    </td>
                    <td>
                      <Link href={`/admin/products/${product.id}`} className="font-medium hover:underline">
                        {product.name}
                      </Link>
                      <span className="mt-0.5 flex gap-1.5">
                        {product.featured && <Badge>Featured</Badge>}
                        {product.isNew && <Badge tone="info">New</Badge>}
                      </span>
                    </td>
                    <td className="text-zinc-600">{product.category ?? "—"}</td>
                    <td className="tabular-nums">
                      {money(product.price)}
                      {product.compareAtPrice && <s className="ml-1.5 text-xs text-zinc-400">{money(product.compareAtPrice)}</s>}
                    </td>
                    <td>
                      <span className={product.stock === 0 ? "text-red-600" : product.stock <= threshold ? "text-amber-600" : undefined}>
                        {product.stock} in {product.variants} variants
                      </span>
                    </td>
                    <td>
                      <Badge tone={product.status === "active" ? "good" : "warn"}>{product.status}</Badge>
                    </td>
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
