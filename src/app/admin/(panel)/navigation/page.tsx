import type { Metadata } from "next";
import { NavigationView } from "@/components/admin/settings-forms";
import { adminConfig } from "@/lib/admin-data";

export const metadata: Metadata = { title: "Navigation" };
export const instant = false;

export default async function NavigationPage() {
  const config = await adminConfig();
  return <NavigationView initial={config.navigation} />;
}
