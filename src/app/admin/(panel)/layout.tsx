import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { AdminShell } from "@/components/admin/shell";
import { requireAdmin } from "@/lib/auth";
import { getSiteConfig } from "@/lib/data";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin" },
  robots: { index: false, follow: false },
};

// Admin pages are private and always rendered per request; skip instant-navigation validation.
export const instant = false;

// The session is checked here for the shell, and again inside every admin data read and action.
async function Shell({ children }: { children: ReactNode }) {
  const [user, config] = await Promise.all([requireAdmin(), getSiteConfig()]);
  return (
    <AdminShell storeName={config.general.storeName} userName={user.name}>
      {children}
    </AdminShell>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="admin" />}>
      <Shell>{children}</Shell>
    </Suspense>
  );
}
