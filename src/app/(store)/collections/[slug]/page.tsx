import type { Metadata } from "next";
import { Suspense } from "react";
import { Listing, ListingSkeleton, type SearchParams } from "@/components/store/listing";
import { getCategories, getCategory, staticSlugs } from "@/lib/data";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<SearchParams> };

export function generateStaticParams() {
  return staticSlugs(getCategories, "all");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) return { title: "Collection" };
  return {
    title: category.name,
    description: category.description || undefined,
    alternates: { canonical: `/collections/${category.slug}` },
    openGraph: category.image ? { images: [category.image] } : undefined,
  };
}

export default function CollectionPage({ params, searchParams }: Props) {
  return (
    <Suspense fallback={<ListingSkeleton />}>
      <Listing params={params} searchParams={searchParams} />
    </Suspense>
  );
}
