import type { Metadata } from "next";
import { NotificationsView } from "@/components/admin/notifications-view";
import { adminConfig, adminNotifications } from "@/lib/admin-data";
import { emailConfigured, sampleEmails, smsProvider, whatsappConfigured } from "@/lib/notify";
import { siteUrl } from "@/lib/site-url";

export const metadata: Metadata = { title: "Notifications" };
export const instant = false;

export default async function NotificationsPage() {
  const [log, config, base] = await Promise.all([adminNotifications(), adminConfig(), siteUrl()]);

  return (
    <NotificationsView
      log={log}
      previews={sampleEmails(config, base).map((sample) => ({
        key: sample.key,
        label: sample.label,
        when: sample.when,
        subject: sample.email.subject,
        html: sample.email.html,
      }))}
      channels={{
        email: emailConfigured(),
        sms: smsProvider(),
        whatsapp: whatsappConfigured(),
        from: process.env.EMAIL_FROM ?? "",
      }}
    />
  );
}
