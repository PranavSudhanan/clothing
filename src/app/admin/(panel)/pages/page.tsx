import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Badge, PageHeader } from "@/components/admin/ui";
import { adminPages } from "@/lib/admin-data";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Pages & layout" };
export const instant = false;

export default async function PagesPage() {
  const pages = await adminPages();

  return (
    <>
      <PageHeader
        title="Pages & layout"
        description="Every page is built from sections you can add, reorder, hide and edit — including the home page and the couture landing page."
        actions={
          <Link href="/admin/pages/new" className="a-btn a-btn-primary">
            <Plus size={15} /> New page
          </Link>
        }
      />
      <div className="a-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="a-table">
            <thead>
              <tr>
                <th>Page</th>
                <th>Address</th>
                <th>Sections</th>
                <th>Status</th>
                <th>Last edited</th>
                <th className="w-28" />
              </tr>
            </thead>
            <tbody>
              {pages.map((page) => (
                <tr key={page.id}>
                  <td>
                    <Link href={`/admin/pages/${page.id}`} className="font-medium hover:underline">
                      {page.title}
                    </Link>
                    {page.system && (
                      <span className="ml-2">
                        <Badge>Built-in</Badge>
                      </span>
                    )}
                  </td>
                  <td className="text-zinc-500">{page.slug === "home" ? "/" : `/${page.slug}`}</td>
                  <td className="tabular-nums text-zinc-600">{page.sections.length}</td>
                  <td>
                    <Badge tone={page.published ? "good" : "warn"}>{page.published ? "Published" : "Hidden"}</Badge>
                  </td>
                  <td className="whitespace-nowrap text-zinc-500">{formatDate(page.updatedAt)}</td>
                  <td className="text-right">
                    <Link href={`/admin/pages/${page.id}`} className="a-btn">
                      Edit layout
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
