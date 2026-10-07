import { RefreshCw, Truck } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductGrid } from "@/components/store/product-card";
import { ProductGallery, ProductPurchase } from "@/components/store/product-view";
import { Markdown } from "@/components/store/sections";
import { Breadcrumbs, SectionHeading } from "@/components/store/ui";
import { getProductBySlug, getProductSlugs, getSiteConfig, staticSlugs } from "@/lib/data";

type Props = { params: Promise<{ slug: string }> };

// Fully cacheable: unknown URLs are generated on first visit and return a real 404 when missing.
export const ensureStatic = "navigation";

export function generateStaticParams() {
  return staticSlugs(getProductSlugs, "coming-soon");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getProductBySlug(slug);
  if (!data) return { title: "Product not found" };
  const { product } = data;
  const description = product.seoDescription || product.description.slice(0, 160);
  return {
    title: product.seoTitle || product.name,
    description,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: { title: product.name, description, images: product.images.slice(0, 1) },
  };
}

function Detail({ title, children, open = false }: { title: string; children: React.ReactNode; open?: boolean }) {
  return (
    <details open={open} className="group border-b border-line">
      <summary className="flex list-none items-center justify-between py-4 text-[0.78rem] font-medium uppercase tracking-[0.14em] [&::-webkit-details-marker]:hidden">
        {title}
        <span aria-hidden className="text-lg font-light text-muted transition-transform duration-300 group-open:rotate-45">
          +
        </span>
      </summary>
      <div className="pb-6 text-[0.95rem] leading-relaxed text-muted">{children}</div>
    </details>
  );
}

async function ProductView({ params }: Props) {
  const { slug } = await params;
  const [data, config] = await Promise.all([getProductBySlug(slug), getSiteConfig()]);
  if (!data) notFound();
  const { product, related } = data;
  const { commerce, general } = config;

  const inStock = product.variants.some((v) => v.stock > 0);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images,
    brand: { "@type": "Brand", name: general.storeName },
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: commerce.currency,
      availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="container-page py-8 md:py-12">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Shop", href: "/shop" },
            ...(product.category ? [{ label: product.category.name, href: `/collections/${product.category.slug}` }] : []),
            { label: product.name },
          ]}
        />

        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-16">
          <ProductGallery images={product.images} name={product.name} />

          <div className="lg:sticky lg:top-28 lg:self-start">
            {product.category && <p className="eyebrow mb-3">{product.category.name}</p>}
            <h1 className="mb-5 text-4xl md:text-5xl">{product.name}</h1>

            <ProductPurchase
              product={{
                id: product.id,
                slug: product.slug,
                name: product.name,
                price: product.price,
                compareAtPrice: product.compareAtPrice,
                image: product.images[0] ?? "",
                sizes: product.sizes,
                colors: product.colors,
              }}
              variants={product.variants.map((v) => ({ id: v.id, size: v.size, color: v.color, stock: v.stock }))}
              lowStockThreshold={commerce.lowStockThreshold}
            />

            <ul className="mt-6 space-y-2.5 text-sm text-muted">
              {commerce.deliveryNote && (
                <li className="flex gap-3">
                  <Truck size={17} strokeWidth={1.3} className="mt-0.5 shrink-0" /> {commerce.deliveryNote}
                </li>
              )}
              {commerce.returnsNote && (
                <li className="flex gap-3">
                  <RefreshCw size={17} strokeWidth={1.3} className="mt-0.5 shrink-0" /> {commerce.returnsNote}
                </li>
              )}
            </ul>

            <div className="mt-8 border-t border-line">
              {product.description && (
                <Detail title="Description" open>
                  <Markdown source={product.description} className="!text-[0.95rem]" />
                </Detail>
              )}
              {(product.fabric || product.fit) && (
                <Detail title="Fabric & fit">
                  <dl className="space-y-2">
                    {product.fabric && (
                      <div className="flex gap-3">
                        <dt className="w-16 shrink-0 text-fg">Fabric</dt>
                        <dd>{product.fabric}</dd>
                      </div>
                    )}
                    {product.fit && (
                      <div className="flex gap-3">
                        <dt className="w-16 shrink-0 text-fg">Fit</dt>
                        <dd>{product.fit}</dd>
                      </div>
                    )}
                  </dl>
                </Detail>
              )}
              {product.care && <Detail title="Care">{product.care}</Detail>}
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="section border-t border-line">
          <div className="container-page">
            <SectionHeading eyebrow="You may also like" title="Complete the look" />
            <ProductGrid products={related} />
          </div>
        </section>
      )}
    </>
  );
}

function ProductSkeleton() {
  return (
    <div className="container-page py-8 md:py-12">
      <div className="skeleton h-3 w-56" />
      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-16">
        <div className="skeleton" style={{ aspectRatio: "4 / 5" }} />
        <div className="space-y-5">
          <div className="skeleton h-12 w-3/4" />
          <div className="skeleton h-7 w-32" />
          <div className="skeleton h-11 w-full" />
          <div className="skeleton h-12 w-full" />
          <div className="skeleton h-32 w-full" />
        </div>
      </div>
    </div>
  );
}

export default function ProductPage({ params }: Props) {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <ProductView params={params} />
    </Suspense>
  );
}
