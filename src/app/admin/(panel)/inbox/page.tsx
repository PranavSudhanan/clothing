import type { Metadata } from "next";
import { InboxView } from "@/components/admin/library-views";
import { adminInbox } from "@/lib/admin-data";

export const metadata: Metadata = { title: "Inbox" };
export const instant = false;

export default async function InboxPage() {
  const { messages, subscribers } = await adminInbox();
  return <InboxView messages={messages} subscribers={subscribers} />;
}
