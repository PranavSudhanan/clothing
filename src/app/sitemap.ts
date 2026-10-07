import type { MetadataRoute } from "next";
import { getCategories, getCoutureServices, getPageSlugs, getProductSlugs } from "@/lib/data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const [products, categories, services, pages] = await Promise.all([
    getProductSlugs(),
    getCategories(),
    getCoutureServices(),
    getPageSlugs(),
  ]);

  return [
    { url: `${base}/`, priority: 1 },
    { url: `${base}/shop`, priority: 0.9 },
    { url: `${base}/couture`, priority: 0.9 },
    ...categories.map((c) => ({ url: `${base}/collections/${c.slug}`, priority: 0.8 })),
    ...services.map((s) => ({ url: `${base}/couture/${s.slug}`, priority: 0.8 })),
    ...products.map((p) => ({ url: `${base}/product/${p.slug}`, lastModified: p.updatedAt, priority: 0.7 })),
    ...pages.map((p) => ({ url: `${base}/${p.slug}`, lastModified: p.updatedAt, priority: 0.5 })),
  ];
}
