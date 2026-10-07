import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Sections } from "@/components/store/sections";
import { getPage, getPageSlugs, staticSlugs } from "@/lib/data";

type Props = { params: Promise<{ slug: string }> };

// Fully cacheable: unknown URLs are generated on first visit and return a real 404 when missing.
export const ensureStatic = "navigation";

export function generateStaticParams() {
  return staticSlugs(getPageSlugs, "about");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page || page.system) return {};
  return {
    title: page.seoTitle || page.title,
    description: page.seoDescription || undefined,
    alternates: { canonical: `/${page.slug}` },
  };
}

async function PageContent({ params }: Props) {
  const { slug } = await params;
  const page = await getPage(slug);
  // System pages (home, couture) live at their own routes.
  if (!page || page.system) notFound();
  return <Sections sections={page.sections} />;
}

export default function ContentPage({ params }: Props) {
  return (
    <Suspense fallback={<div className="container-page py-24"><div className="skeleton mx-auto h-10 w-64" /></div>}>
      <PageContent params={params} />
    </Suspense>
  );
}
