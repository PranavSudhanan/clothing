import { Clock, Ruler, Scissors } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CoutureConfigurator } from "@/components/store/couture-configurator";
import { Money } from "@/components/store/providers";
import { Markdown } from "@/components/store/sections";
import { Breadcrumbs, Picture } from "@/components/store/ui";
import { getCoutureService, getCoutureServices, staticSlugs } from "@/lib/data";

type Props = { params: Promise<{ slug: string }> };

// Fully cacheable: unknown URLs are generated on first visit and return a real 404 when missing.
export const ensureStatic = "navigation";

export function generateStaticParams() {
  return staticSlugs(getCoutureServices, "bespoke");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getCoutureService(slug);
  if (!data) return { title: "Couture" };
  return {
    title: `${data.service.name} — Couture`,
    description: data.service.tagline || undefined,
    alternates: { canonical: `/couture/${data.service.slug}` },
    openGraph: data.service.image ? { images: [data.service.image] } : undefined,
  };
}

async function ServiceView({ params }: Props) {
  const { slug } = await params;
  const data = await getCoutureService(slug);
  if (!data) notFound();
  const { service, fabrics } = data;

  return (
    <>
      <div className="container-page py-8 md:py-12">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Couture", href: "/couture" }, { label: service.name }]} />

        <div className="mt-8 grid items-center gap-10 lg:grid-cols-2 lg:gap-20">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-3 overflow-hidden bg-surface" style={{ aspectRatio: "4 / 3", borderRadius: "var(--radius)" }}>
              <Picture src={service.image} alt={service.name} width={1400} eager />
            </div>
            {service.gallery.slice(0, 3).map((src) => (
              <div key={src} className="overflow-hidden bg-surface" style={{ aspectRatio: "1 / 1", borderRadius: "var(--radius)" }}>
                <Picture src={src} alt="" width={500} />
              </div>
            ))}
          </div>

          <div>
            <p className="eyebrow mb-4">Couture & stitching</p>
            <h1 className="text-5xl md:text-6xl">{service.name}</h1>
            {service.tagline && <p className="heading mt-4 text-2xl text-muted">{service.tagline}</p>}
            <Markdown source={service.description} className="mt-6" />

            <ul className="mt-8 grid gap-5 border-y border-line py-6 sm:grid-cols-3">
              <li className="flex items-start gap-3">
                <Scissors size={22} strokeWidth={1.2} className="mt-0.5 shrink-0 text-accent" />
                <div>
                  <p className="text-[0.7rem] uppercase tracking-[0.14em] text-muted">Starting from</p>
                  <Money amount={service.basePrice} className="heading text-2xl" />
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Clock size={22} strokeWidth={1.2} className="mt-0.5 shrink-0 text-accent" />
                <div>
                  <p className="text-[0.7rem] uppercase tracking-[0.14em] text-muted">Ready in</p>
                  <p className="heading text-2xl">{service.leadTimeDays} days</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Ruler size={22} strokeWidth={1.2} className="mt-0.5 shrink-0 text-accent" />
                <div>
                  <p className="text-[0.7rem] uppercase tracking-[0.14em] text-muted">Fabrics</p>
                  <p className="heading text-2xl">{fabrics.length} cloths</p>
                </div>
              </li>
            </ul>

            <a href="#configure" className="btn btn-primary mt-8">
              Start your order
            </a>
          </div>
        </div>
      </div>

      <section id="configure" data-tone="surface" className="section scroll-mt-24">
        <div className="container-page">
          <div className="mb-12 max-w-2xl">
            <p className="eyebrow mb-3">Design your {service.name.toLowerCase()}</p>
            <h2 className="text-4xl md:text-5xl">Four steps. No payment today.</h2>
          </div>
          <CoutureConfigurator
            service={{
              id: service.id,
              name: service.name,
              basePrice: service.basePrice,
              leadTimeDays: service.leadTimeDays,
              measurementFields: service.measurementFields,
              styleOptions: service.styleOptions,
            }}
            fabrics={fabrics.map((f) => ({
              id: f.id,
              name: f.name,
              material: f.material,
              hex: f.hex,
              image: f.image,
              priceDelta: f.priceDelta,
            }))}
          />
        </div>
      </section>
    </>
  );
}

export default function CoutureServicePage({ params }: Props) {
  return (
    <Suspense
      fallback={
        <div className="container-page py-12">
          <div className="grid gap-10 lg:grid-cols-2">
            <div className="skeleton" style={{ aspectRatio: "4 / 3" }} />
            <div className="space-y-5">
              <div className="skeleton h-14 w-3/4" />
              <div className="skeleton h-28" />
              <div className="skeleton h-12 w-48" />
            </div>
          </div>
        </div>
      }
    >
      <ServiceView params={params} />
    </Suspense>
  );
}
