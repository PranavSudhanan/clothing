import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn, imageUrl, isExternal } from "@/lib/utils";

/** next/link for internal routes, a plain anchor for external URLs and in-page anchors. */
export function SmartLink({
  href,
  children,
  ...props
}: { href: string; children: ReactNode } & Omit<ComponentProps<"a">, "href">) {
  const target = href || "#";
  if (isExternal(target)) {
    return (
      <a href={target} target="_blank" rel="noopener noreferrer" {...props}>
        {children}
      </a>
    );
  }
  if (target.startsWith("#")) {
    return (
      <a href={target} {...props}>
        {children}
      </a>
    );
  }
  return (
    <Link href={target} {...props}>
      {children}
    </Link>
  );
}

/** Lazy image that fills its parent. Renders a neutral block when no source is set. */
export function Picture({
  src,
  alt,
  width = 900,
  className,
  eager = false,
}: {
  src: string | undefined | null;
  alt: string;
  width?: number;
  className?: string;
  eager?: boolean;
}) {
  if (!src) {
    return <div aria-hidden className={cn("h-full w-full bg-surface", className)} />;
  }
  return (
    <img
      src={imageUrl(src, width)}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      className={cn("h-full w-full object-cover", className)}
    />
  );
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
  action,
  as: Tag = "h2",
}: {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  align?: "left" | "center";
  action?: ReactNode;
  as?: "h1" | "h2";
}) {
  if (!eyebrow && !title && !subtitle && !action) return null;
  return (
    <div
      className={cn(
        "mb-10 flex flex-col gap-4 md:mb-14",
        align === "center" ? "items-center text-center" : "md:flex-row md:items-end md:justify-between",
      )}
    >
      <div className={cn("max-w-2xl", align === "center" && "mx-auto")}>
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        {title && <Tag className="text-3xl md:text-[2.75rem]">{title}</Tag>}
        {subtitle && <p className="mt-4 text-base leading-relaxed text-muted">{subtitle}</p>}
      </div>
      {action && <div className={cn("shrink-0", align === "center" && "mt-2")}>{action}</div>}
    </div>
  );
}

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs tracking-wide text-muted">
      {items.map((item, i) => (
        <span key={`${item.label}-${i}`} className="flex items-center gap-2">
          {i > 0 && <span aria-hidden>/</span>}
          {item.href ? (
            <Link href={item.href} className="transition-colors hover:text-fg">
              {item.label}
            </Link>
          ) : (
            <span className="text-fg">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

export function EmptyState({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-20 text-center">
      <h2 className="text-2xl">{title}</h2>
      {text && <p className="mt-3 text-muted">{text}</p>}
      {action && <div className="mt-8">{action}</div>}
    </div>
  );
}

export function StatusPill({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "good" | "warn" | "bad" }) {
  const tones = {
    neutral: "border-line text-fg",
    good: "border-emerald-600/40 text-emerald-700",
    warn: "border-amber-600/40 text-amber-700",
    bad: "border-red-600/40 text-red-700",
  };
  return (
    <span className={cn("inline-flex items-center border px-2.5 py-1 text-[0.68rem] font-medium uppercase tracking-[0.12em]", tones[tone])}>
      {children}
    </span>
  );
}
