import type { Metadata } from "next";
import { SettingsView } from "@/components/admin/settings-forms";
import { usingEmbeddedDb } from "@/db";
import { adminConfig } from "@/lib/admin-data";
import { razorpayConfigured } from "@/lib/razorpay";

export const metadata: Metadata = { title: "Settings" };
export const instant = false;

export default async function SettingsPage() {
  const config = await adminConfig();
  return (
    <SettingsView
      config={config}
      razorpayReady={razorpayConfigured()}
      blobReady={Boolean(process.env.BLOB_READ_WRITE_TOKEN)}
      embeddedDb={usingEmbeddedDb()}
    />
  );
}
