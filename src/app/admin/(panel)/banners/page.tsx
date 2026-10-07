import type { Metadata } from "next";
import { ResourceManager } from "@/components/admin/resource-manager";
import { adminConfig, adminRefs, adminResource } from "@/lib/admin-data";

export const metadata: Metadata = { title: "Banners" };
export const instant = false;

export default async function Page() {
  const [rows, refs, config] = await Promise.all([adminResource("banners"), adminRefs(), adminConfig()]);
  return (
    <ResourceManager
      resource="banners"
      rows={rows}
      refs={refs}
      currency={config.commerce.currency}
      locale={config.commerce.locale}
    />
  );
}
