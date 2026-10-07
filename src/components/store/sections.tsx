import {
  ArrowRight,
  Award,
  Clock,
  CreditCard,
  Gift,
  Heart,
  Mail,
  MapPin,
  Package,
  Phone,
  RefreshCw,
  Ruler,
  Scissors,
  ShieldCheck,
  Shirt,
  Sparkles,
  Star,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { marked } from "marked";
import type { ReactNode } from "react";
import { getBanners, getCategories, getCoutureServices, getFabrics, getProducts, getSiteConfig } from "@/lib/data";
import type { Section, SectionData } from "@/lib/types";
import { cn } from "@/lib/utils";
import { EnquiryForm, NewsletterForm } from "./forms";
import { HeroSlider } from "./hero-slider";
import { ProductCard, ProductGrid } from "./product-card";
import { Money } from "./providers";
import { Picture, SectionHeading, SmartLink } from "./ui";

const ICONS: Record<string, LucideIcon> = {
  truck: Truck,
  scissors: Scissors,
  ruler: Ruler,
  shield: ShieldCheck,
  refresh: RefreshCw,
  gift: Gift,
  sparkles: Sparkles,
  clock: Clock,
  pin: MapPin,
  phone: Phone,
  star: Star,
  award: Award,
  package: Package,
  card: CreditCard,
  heart: Heart,
  shirt: Shirt,
};

export function Markdown({ source, className }: { source: string; className?: string }) {
  if (!source?.trim()) return null;
  const html = marked.parse(source, { async: false, gfm: true, breaks: true });
  return <div className={cn("prose-store", className)} dangerouslySetInnerHTML={{ __html: html }} />;
}

function Shell({
  data,
  children,
  id,
  className,
}: {
  data: SectionData;
  children: ReactNode;
  id?: string;
  className?: string;
}) {
  const tone = ["surface", "dark", "accent"].includes(data.tone) ? data.tone : undefined;
  const spacing = ["none", "small", "large"].includes(data.spacing) ? data.spacing : undefined;
  return (
    <section id={id} data-tone={tone} data-spacing={spacing} className={cn("section", className)}>
      {children}
    </section>
  );
}

const str = (value: unknown) => (typeof value === "string" ? value : "");
const num = (value: unknown, fallback: number) => (Number.isFinite(Number(value)) ? Number(value) : fallback);
const list = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

async function Hero({ data }: { data: SectionData }) {
  const banners = await getBanners(str(data.placement) || "home-hero");
  if (banners.length === 0) return null;
  return (
    <HeroSlider
      height={str(data.height) || "large"}
      interval={num(data.interval, 6)}
      slides={banners.map((b) => ({
        id: b.id,
        eyebrow: b.eyebrow,
        title: b.title,
        subtitle: b.subtitle,
        image: b.image,
        mobileImage: b.mobileImage,
        ctaLabel: b.ctaLabel,
        ctaHref: b.ctaHref,
        cta2Label: b.cta2Label,
        cta2Href: b.cta2Href,
        align: b.align,
        overlay: b.overlay,
      }))}
    />
  );
}

function Marquee({ data }: { data: SectionData }) {
  const items = list<{ text: string }>(data.items).filter((i) => i.text);
  if (items.length === 0) return null;
  const duration = { slow: 50, normal: 32, fast: 18 }[str(data.speed)] ?? 32;
  // The track is rendered twice and shifted by half its width for a seamless loop.
  const repeated = Array.from({ length: Math.max(2, Math.ceil(12 / items.length)) }, () => items).flat();
  return (
    <Shell data={data} className="overflow-hidden !py-5">
      <div className="flex w-max" style={{ animation: `marquee ${duration}s linear infinite` }}>
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 items-center" aria-hidden={copy === 1}>
            {repeated.map((item, i) => (
              <span key={i} className="heading flex items-center gap-8 px-4 text-2xl md:text-3xl">
                {item.text}
                <span className="text-base text-accent">✦</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </Shell>
  );
}

async function Categories({ data }: { data: SectionData }) {
  const all = await getCategories();
  const categories = all.slice(0, Math.max(1, num(data.limit, 6)));
  if (categories.length === 0) return null;
  const columns = { "3": "lg:grid-cols-3", "4": "lg:grid-cols-4", "6": "lg:grid-cols-6" }[str(data.columns)] ?? "lg:grid-cols-3";
  return (
    <Shell data={data}>
      <div className="container-page">
        <SectionHeading eyebrow={data.eyebrow} title={data.title} subtitle={data.subtitle} />
        <div className={cn("grid grid-cols-2 gap-3 md:gap-5", columns)}>
          {categories.map((category) => (
            <SmartLink
              key={category.id}
              href={`/collections/${category.slug}`}
              className="group relative block overflow-hidden bg-surface"
              style={{ aspectRatio: "4 / 5", borderRadius: "var(--radius)" }}
            >
              <Picture
                src={category.image}
                alt={category.name}
                width={800}
                className="transition-transform duration-[900ms] ease-out group-hover:scale-105"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-transparent" />
              <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 text-white md:p-6">
                <span className="heading text-xl md:text-[1.7rem]">{category.name}</span>
                <ArrowRight
                  size={20}
                  strokeWidth={1.4}
                  className="mb-1 shrink-0 -translate-x-2 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100"
                />
              </span>
            </SmartLink>
          ))}
        </div>
      </div>
    </Shell>
  );
}

async function Products({ data }: { data: SectionData }) {
  const source = str(data.source) || "featured";
  const limit = Math.min(Math.max(num(data.limit, 8), 1), 24);
  const { items } = await getProducts({
    perPage: limit,
    ...(source === "manual"
      ? { ids: list<string>(data.productIds) }
      : source === "category"
        ? { category: str(data.category) || undefined, sort: "featured" as const }
        : source === "all"
          ? { sort: "newest" as const }
          : { source: source as "featured" | "new" | "sale", sort: "newest" as const }),
  });
  if (items.length === 0) return null;

  const action = data.ctaLabel ? (
    <SmartLink href={str(data.ctaHref) || "/shop"} className="link-underline">
      {data.ctaLabel} <ArrowRight size={14} strokeWidth={1.5} />
    </SmartLink>
  ) : null;

  return (
    <Shell data={data}>
      <div className="container-page">
        <SectionHeading eyebrow={data.eyebrow} title={data.title} subtitle={data.subtitle} align="left" action={action} />
      </div>
      {data.layout === "carousel" ? (
        <div className="mx-auto w-full" style={{ maxWidth: "var(--container)" }}>
          <div className="scroll-row">
            {items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      ) : (
        <div className="container-page">
          <ProductGrid products={items} />
        </div>
      )}
    </Shell>
  );
}

function Split({ data }: { data: SectionData }) {
  const right = data.imagePosition === "right";
  const aspect = ["4/5", "1/1", "4/3"].includes(data.imageAspect) ? String(data.imageAspect).replace("/", " / ") : "4 / 5";
  return (
    <Shell data={data}>
      <div className="container-page grid items-center gap-10 md:grid-cols-2 md:gap-16 lg:gap-24">
        <div
          className={cn("overflow-hidden bg-surface", right && "md:order-2")}
          style={{ aspectRatio: aspect, borderRadius: "var(--radius)" }}
        >
          <Picture src={data.image} alt={str(data.title)} width={1200} />
        </div>
        <div className="max-w-xl">
          {data.eyebrow && <p className="eyebrow mb-4">{data.eyebrow}</p>}
          {data.title && <h2 className="text-3xl md:text-5xl">{data.title}</h2>}
          <Markdown source={str(data.body)} className="mt-6" />
          {(data.ctaLabel || data.cta2Label) && (
            <div className="mt-9 flex flex-wrap gap-3">
              {data.ctaLabel && (
                <SmartLink href={str(data.ctaHref)} className="btn btn-primary">
                  {data.ctaLabel}
                </SmartLink>
              )}
              {data.cta2Label && (
                <SmartLink href={str(data.cta2Href)} className="btn btn-outline">
                  {data.cta2Label}
                </SmartLink>
              )}
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}

async function CoutureServices({ data }: { data: SectionData }) {
  const all = await getCoutureServices();
  const limit = num(data.limit, 0);
  const services = limit > 0 ? all.slice(0, limit) : all;
  if (services.length === 0) return null;
  return (
    <Shell data={data} id="services">
      <div className="container-page">
        <SectionHeading eyebrow={data.eyebrow} title={data.title} subtitle={data.subtitle} />
        <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <SmartLink key={service.id} href={`/couture/${service.slug}`} className="group block">
              <div className="overflow-hidden bg-surface" style={{ aspectRatio: "4 / 5", borderRadius: "var(--radius)" }}>
                <Picture
                  src={service.image}
                  alt={service.name}
                  width={900}
                  className="transition-transform duration-[900ms] ease-out group-hover:scale-105"
                />
              </div>
              <div className="mt-5 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-2xl">{service.name}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{service.tagline}</p>
                </div>
                <ArrowRight
                  size={20}
                  strokeWidth={1.4}
                  className="mt-1.5 shrink-0 transition-transform duration-300 group-hover:translate-x-1"
                />
              </div>
              <p className="mt-3 text-xs uppercase tracking-[0.14em] text-muted">
                From <Money amount={service.basePrice} className="text-fg" /> · {service.leadTimeDays} days
              </p>
            </SmartLink>
          ))}
        </div>
        {data.ctaLabel && (
          <div className="mt-12 text-center">
            <SmartLink href={str(data.ctaHref) || "/couture"} className="btn btn-outline">
              {data.ctaLabel}
            </SmartLink>
          </div>
        )}
      </div>
    </Shell>
  );
}

function Steps({ data }: { data: SectionData }) {
  const items = list<{ title: string; text: string }>(data.items);
  if (items.length === 0) return null;
  return (
    <Shell data={data}>
      <div className="container-page">
        <SectionHeading eyebrow={data.eyebrow} title={data.title} subtitle={data.subtitle} />
        <ol className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {items.map((item, i) => (
            <li key={i} className="border-t border-line pt-6">
              <span className="heading text-5xl text-accent">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="mt-5 text-xl">{item.title}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-muted">{item.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </Shell>
  );
}

function Features({ data }: { data: SectionData }) {
  const items = list<{ icon: string; title: string; text: string }>(data.items);
  if (items.length === 0) return null;
  return (
    <Shell data={data}>
      <div className="container-page">
        <ul className={cn("grid grid-cols-2 gap-x-6 gap-y-8", items.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3")}>
          {items.map((item, i) => {
            const Icon = ICONS[item.icon] ?? Sparkles;
            return (
              <li key={i} className="flex flex-col items-center gap-3 text-center sm:flex-row sm:items-start sm:text-left">
                <Icon size={26} strokeWidth={1.2} className="shrink-0 text-accent" />
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.12em]">{item.title}</p>
                  <p className="mt-1 text-sm text-muted">{item.text}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </Shell>
  );
}

function Testimonials({ data }: { data: SectionData }) {
  const items = list<{ quote: string; name: string; role: string }>(data.items);
  if (items.length === 0) return null;
  return (
    <Shell data={data}>
      <div className="container-page">
        <SectionHeading eyebrow={data.eyebrow} title={data.title} />
        <div className="grid gap-8 md:grid-cols-3">
          {items.map((item, i) => (
            <figure key={i} className="flex flex-col border border-line p-7 md:p-9" style={{ borderRadius: "var(--radius)" }}>
              <span aria-hidden className="heading text-6xl leading-none text-accent">
                “
              </span>
              <blockquote className="heading -mt-3 flex-1 text-xl leading-snug md:text-[1.4rem]">{item.quote}</blockquote>
              <figcaption className="mt-7 text-sm">
                <span className="font-medium">{item.name}</span>
                {item.role && <span className="block text-xs uppercase tracking-[0.14em] text-muted">{item.role}</span>}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </Shell>
  );
}

function Gallery({ data }: { data: SectionData }) {
  const items = list<{ image: string; caption: string; href: string }>(data.items).filter((i) => i.image);
  if (items.length === 0) return null;
  const columns = { "2": "md:grid-cols-2", "3": "md:grid-cols-3", "4": "md:grid-cols-4" }[str(data.columns)] ?? "md:grid-cols-4";
  return (
    <Shell data={data}>
      <div className="container-page">
        <SectionHeading eyebrow={data.eyebrow} title={data.title} subtitle={data.subtitle} />
        <div className={cn("grid grid-cols-2 gap-3 md:gap-5", columns)}>
          {items.map((item, i) => {
            const tile = (
              <>
                <Picture
                  src={item.image}
                  alt={item.caption || ""}
                  width={800}
                  className="transition-transform duration-[900ms] ease-out group-hover:scale-105"
                />
                {item.caption && (
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4 pt-12 text-sm text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    {item.caption}
                  </span>
                )}
              </>
            );
            const className = cn("group relative block overflow-hidden bg-surface", i % 3 === 1 && "md:translate-y-8");
            const style = { aspectRatio: "3 / 4", borderRadius: "var(--radius)" };
            return item.href ? (
              <SmartLink key={i} href={item.href} className={className} style={style}>
                {tile}
              </SmartLink>
            ) : (
              <div key={i} className={className} style={style}>
                {tile}
              </div>
            );
          })}
        </div>
      </div>
    </Shell>
  );
}

function RichText({ data }: { data: SectionData }) {
  const width = { narrow: "max-w-2xl", medium: "max-w-3xl", wide: "max-w-5xl" }[str(data.width)] ?? "max-w-2xl";
  const center = data.align === "center";
  return (
    <Shell data={data}>
      <div className={cn("container-page", center && "text-center")}>
        <div className={cn(width, "mx-auto")}>
          {data.eyebrow && <p className="eyebrow mb-4">{data.eyebrow}</p>}
          {data.title && <h1 className="text-4xl md:text-5xl">{data.title}</h1>}
          <Markdown source={str(data.body)} className={cn(data.title && "mt-8", center && "mx-auto")} />
        </div>
      </div>
    </Shell>
  );
}

function Cta({ data }: { data: SectionData }) {
  const hasImage = Boolean(data.image);
  const center = data.align !== "left";
  const content = (
    <div className={cn("relative flex max-w-2xl flex-col", center ? "mx-auto items-center text-center" : "items-start")}>
      {data.eyebrow && <p className="eyebrow mb-4">{data.eyebrow}</p>}
      {data.title && <h2 className="text-4xl md:text-6xl">{data.title}</h2>}
      {data.text && <p className="mt-5 text-base leading-relaxed text-muted md:text-lg">{data.text}</p>}
      {data.ctaLabel && (
        <SmartLink href={str(data.ctaHref) || "/"} className="btn btn-primary mt-9">
          {data.ctaLabel}
        </SmartLink>
      )}
    </div>
  );

  if (!hasImage) {
    return (
      <Shell data={data}>
        <div className="container-page py-6 md:py-10">{content}</div>
      </Shell>
    );
  }

  const spacing = ["none", "small", "large"].includes(data.spacing) ? data.spacing : undefined;
  return (
    <section className="section" data-spacing={spacing}>
      <div className="relative isolate overflow-hidden bg-[#141414]" data-tone="image">
        <Picture src={data.image} alt="" width={1920} className="absolute inset-0 -z-10" />
        <div
          className="absolute inset-0 -z-10"
          style={{ background: `rgb(0 0 0 / ${Math.min(Math.max(num(data.overlay, 45), 0), 90) / 100})` }}
        />
        <div className="container-page py-24 md:py-36">{content}</div>
      </div>
    </section>
  );
}

async function Fabrics({ data }: { data: SectionData }) {
  const all = await getFabrics();
  const limit = num(data.limit, 0);
  const fabrics = limit > 0 ? all.slice(0, limit) : all;
  if (fabrics.length === 0) return null;
  return (
    <Shell data={data}>
      <div className="container-page">
        <SectionHeading eyebrow={data.eyebrow} title={data.title} subtitle={data.subtitle} />
        <ul className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-6">
          {fabrics.map((fabric) => (
            <li key={fabric.id}>
              <div
                className="relative overflow-hidden border border-black/5"
                style={{ aspectRatio: "1 / 1", background: fabric.hex, borderRadius: "var(--radius)" }}
              >
                {fabric.image ? (
                  <Picture src={fabric.image} alt={fabric.name} width={400} />
                ) : (
                  // A woven texture drawn in CSS so swatches look like cloth without photography.
                  <span
                    aria-hidden
                    className="absolute inset-0 opacity-40 mix-blend-overlay"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(45deg, rgb(255 255 255 / 0.5) 0 1px, transparent 1px 4px), repeating-linear-gradient(-45deg, rgb(0 0 0 / 0.4) 0 1px, transparent 1px 4px)",
                    }}
                  />
                )}
              </div>
              <p className="mt-3 text-sm font-medium leading-snug">{fabric.name}</p>
              <p className="mt-0.5 text-xs text-muted">{fabric.material}</p>
            </li>
          ))}
        </ul>
      </div>
    </Shell>
  );
}

function Faq({ data }: { data: SectionData }) {
  const items = list<{ q: string; a: string }>(data.items).filter((i) => i.q);
  if (items.length === 0) return null;
  return (
    <Shell data={data}>
      <div className="container-page">
        <SectionHeading eyebrow={data.eyebrow} title={data.title} />
        <div className="mx-auto max-w-3xl border-t border-line">
          {items.map((item, i) => (
            <details key={i} className="group border-b border-line">
              <summary className="flex list-none items-center justify-between gap-6 py-5 text-left text-base font-medium [&::-webkit-details-marker]:hidden">
                {item.q}
                <span aria-hidden className="text-xl font-light text-muted transition-transform duration-300 group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="max-w-2xl pb-6 leading-relaxed text-muted">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </Shell>
  );
}

function Newsletter({ data }: { data: SectionData }) {
  return (
    <Shell data={data}>
      <div className="container-page">
        <div className="mx-auto flex max-w-xl flex-col items-center text-center">
          {data.title && <h2 className="text-3xl md:text-[2.75rem]">{data.title}</h2>}
          {data.text && <p className="mt-4 text-muted">{data.text}</p>}
          <div className="mt-8 w-full">
            <NewsletterForm buttonLabel={str(data.buttonLabel) || "Subscribe"} />
          </div>
        </div>
      </div>
    </Shell>
  );
}

async function Contact({ data }: { data: SectionData }) {
  const { general } = await getSiteConfig();
  const details = [
    { icon: MapPin, label: "Studio", value: general.address },
    { icon: Clock, label: "Hours", value: general.hours },
    { icon: Phone, label: "Phone", value: general.phone, href: `tel:${general.phone.replace(/\s/g, "")}` },
    { icon: Mail, label: "Email", value: general.email, href: `mailto:${general.email}` },
  ].filter((d) => d.value);
  const mapUrl = str(data.mapUrl);

  return (
    <Shell data={data}>
      <div className="container-page grid gap-14 lg:grid-cols-2 lg:gap-24">
        <div>
          {data.eyebrow && <p className="eyebrow mb-4">{data.eyebrow}</p>}
          {data.title && <h1 className="text-4xl md:text-6xl">{data.title}</h1>}
          {data.text && <p className="mt-6 max-w-md leading-relaxed text-muted">{data.text}</p>}
          <ul className="mt-10 space-y-6">
            {details.map((detail) => (
              <li key={detail.label} className="flex gap-4">
                <detail.icon size={20} strokeWidth={1.3} className="mt-0.5 shrink-0 text-accent" />
                <div>
                  <p className="text-[0.7rem] uppercase tracking-[0.16em] text-muted">{detail.label}</p>
                  {detail.href ? (
                    <a href={detail.href} className="mt-1 block hover:text-accent">
                      {detail.value}
                    </a>
                  ) : (
                    <p className="mt-1">{detail.value}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
          {mapUrl.startsWith("https://") && (
            <iframe
              src={mapUrl}
              title="Map"
              loading="lazy"
              className="mt-10 h-64 w-full border border-line grayscale"
              referrerPolicy="no-referrer-when-downgrade"
            />
          )}
        </div>
        {data.showForm !== false && (
          <div className="border border-line p-6 md:p-10" style={{ borderRadius: "var(--radius)" }}>
            <h2 className="mb-7 text-2xl">Send us a message</h2>
            <EnquiryForm />
          </div>
        )}
      </div>
    </Shell>
  );
}

function renderSection(section: Section) {
  const { data } = section;
  switch (section.type) {
    case "hero":
      return <Hero data={data} />;
    case "marquee":
      return <Marquee data={data} />;
    case "categories":
      return <Categories data={data} />;
    case "products":
      return <Products data={data} />;
    case "split":
      return <Split data={data} />;
    case "coutureServices":
      return <CoutureServices data={data} />;
    case "steps":
      return <Steps data={data} />;
    case "features":
      return <Features data={data} />;
    case "testimonials":
      return <Testimonials data={data} />;
    case "gallery":
      return <Gallery data={data} />;
    case "richText":
      return <RichText data={data} />;
    case "cta":
      return <Cta data={data} />;
    case "fabrics":
      return <Fabrics data={data} />;
    case "faq":
      return <Faq data={data} />;
    case "newsletter":
      return <Newsletter data={data} />;
    case "contact":
      return <Contact data={data} />;
    default:
      return null;
  }
}

export function Sections({ sections }: { sections: Section[] }) {
  return (
    <>
      {sections
        .filter((section) => section.enabled)
        .map((section) => (
          <div key={section.id}>{renderSection(section)}</div>
        ))}
    </>
  );
}
