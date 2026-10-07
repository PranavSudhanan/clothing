import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Sections } from "@/components/store/sections";
import { getPage } from "@/lib/data";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage("couture");
  return {
    title: page?.seoTitle || "Couture & stitching",
    description:
      page?.seoDescription || "Bespoke suits, tuxedos, blazers and shirts — cut and stitched to your measurements.",
    alternates: { canonical: "/couture" },
  };
}

export default async function CouturePage() {
  const page = await getPage("couture");
  if (!page) notFound();
  return <Sections sections={page.sections} />;
}
