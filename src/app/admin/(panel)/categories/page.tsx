import type { Metadata } from "next";
import { ResourceManager } from "@/components/admin/resource-manager";
import { adminConfig, adminRefs, adminResource } from "@/lib/admin-data";

export const metadata: Metadata = { title: "Categories" };
export const instant = false;

export default async function Page() {
  const [rows, refs, config] = await Promise.all([adminResource("categories"), adminRefs(), adminConfig()]);
  return (
    <ResourceManager
      resource="categories"
      rows={rows}
      refs={refs}
      currency={config.commerce.currency}
      locale={config.commerce.locale}
    />
  );
}
