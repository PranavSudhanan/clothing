import type { Metadata } from "next";
import { ResourceManager } from "@/components/admin/resource-manager";
import { adminConfig, adminRefs, adminResource } from "@/lib/admin-data";

export const metadata: Metadata = { title: "Couture services" };
export const instant = false;

export default async function Page() {
  const [rows, refs, config] = await Promise.all([adminResource("services"), adminRefs(), adminConfig()]);
  return (
    <ResourceManager
      resource="services"
      rows={rows}
      refs={refs}
      currency={config.commerce.currency}
      locale={config.commerce.locale}
    />
  );
}
