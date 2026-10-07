import type { Metadata } from "next";
import { Suspense } from "react";
import { Listing, ListingSkeleton, type SearchParams } from "@/components/store/listing";

export const metadata: Metadata = {
  title: "Shop ready-to-wear",
  description: "Shirts, suits, trousers, jackets and denim — in stock and ready to ship.",
  alternates: { canonical: "/shop" },
};

export default function ShopPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <Suspense fallback={<ListingSkeleton />}>
      <Listing searchParams={searchParams} />
    </Suspense>
  );
}
