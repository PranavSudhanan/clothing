import type { Metadata } from "next";
import { ThemeEditor } from "@/components/admin/theme-editor";
import { adminConfig } from "@/lib/admin-data";

export const metadata: Metadata = { title: "Theme" };
export const instant = false;

export default async function ThemePage() {
  const config = await adminConfig();
  return <ThemeEditor initial={config.theme} storeName={config.general.storeName} />;
}
