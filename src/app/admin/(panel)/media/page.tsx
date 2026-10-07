import type { Metadata } from "next";
import { MediaLibrary } from "@/components/admin/library-views";
import { adminMedia } from "@/lib/admin-data";

export const metadata: Metadata = { title: "Media" };
export const instant = false;

export default async function MediaPage() {
  const items = await adminMedia();
  return <MediaLibrary items={items.map((item) => ({ id: item.id, url: item.url, name: item.name, size: item.size }))} />;
}
