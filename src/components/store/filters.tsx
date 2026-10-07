"use client";

import { SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition, type FormEvent } from "react";
import type { Facets } from "@/lib/data";
import { cn } from "@/lib/utils";
import { useMoney } from "./providers";

export type ListingState = {
  q: string;
  sizes: string[];
  colors: string[];
  min: string;
  max: string;
  sort: string;
};

const SORTS = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "name", label: "Name: A to Z" },
];

function buildHref(basePath: string, state: ListingState) {
  const params = new URLSearchParams();
  if (state.q) params.set("q", state.q);
  if (state.sizes.length) params.set("size", state.sizes.join(","));
  if (state.colors.length) params.set("color", state.colors.join(","));
  if (state.min) params.set("min", state.min);
  if (state.max) params.set("max", state.max);
  if (state.sort && state.sort !== "featured") params.set("sort", state.sort);
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

type Props = {
  basePath: string;
  state: ListingState;
  facets: Facets;
  total: number;
  categories: { name: string; slug: string }[];
  activeCategory?: string;
};

export function Filters({ basePath, state, facets, total, categories, activeCategory }: Props) {
  const router = useRouter();
  const money = useMoney();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const update = (patch: Partial<ListingState>) => {
    start(() => router.push(buildHref(basePath, { ...state, ...patch }), { scroll: false }));
  };
  const toggle = (key: "sizes" | "colors", value: string) => {
    const current = state[key];
    update({ [key]: current.includes(value) ? current.filter((v) => v !== value) : [...current, value] });
  };
  const onPrice = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const clean = (v: FormDataEntryValue | null) => String(v ?? "").replace(/[^\d.]/g, "");
    update({ min: clean(data.get("min")), max: clean(data.get("max")) });
  };

  const activeCount = state.sizes.length + state.colors.length + (state.min || state.max ? 1 : 0);
  const hasFilters = activeCount > 0 || Boolean(state.q);

  const groupTitle = "mb-4 text-[0.72rem] font-medium uppercase tracking-[0.16em]";

  const panel = (
    <div className="space-y-9">
      <div>
        <p className={groupTitle}>Category</p>
        <ul className="space-y-2.5 text-sm">
          <li>
            <Link href="/shop" className={cn("hover:text-accent", !activeCategory ? "font-medium text-fg" : "text-muted")}>
              All products
            </Link>
          </li>
          {categories.map((category) => (
            <li key={category.slug}>
              <Link
                href={`/collections/${category.slug}`}
                className={cn("hover:text-accent", activeCategory === category.slug ? "font-medium text-fg" : "text-muted")}
              >
                {category.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {facets.sizes.length > 0 && (
        <div>
          <p className={groupTitle}>Size</p>
          <div className="flex flex-wrap gap-2">
            {facets.sizes.map((size) => {
              const active = state.sizes.includes(size);
              return (
                <button
                  key={size}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggle("sizes", size)}
                  className={cn(
                    "min-w-10 border px-2.5 py-2 text-xs transition-colors",
                    active ? "border-fg bg-fg text-bg" : "border-line hover:border-fg",
                  )}
                  style={{ borderRadius: "var(--radius)" }}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {facets.colors.length > 0 && (
        <div>
          <p className={groupTitle}>Colour</p>
          <div className="flex flex-wrap gap-2.5">
            {facets.colors.map((color) => {
              const active = state.colors.includes(color.name);
              return (
                <button
                  key={color.name}
                  type="button"
                  title={color.name}
                  aria-label={color.name}
                  aria-pressed={active}
                  onClick={() => toggle("colors", color.name)}
                  className={cn(
                    "h-7 w-7 rounded-full border border-black/10 outline-offset-2 transition-all",
                    active ? "outline outline-1 outline-fg" : "hover:outline hover:outline-1 hover:outline-line",
                  )}
                  style={{ background: color.hex }}
                />
              );
            })}
          </div>
        </div>
      )}

      {facets.maxPrice > 0 && (
        <div>
          <p className={groupTitle}>Price</p>
          <form onSubmit={onPrice} className="flex items-center gap-2" key={`${state.min}-${state.max}`}>
            <input
              name="min"
              inputMode="numeric"
              defaultValue={state.min}
              placeholder={String(facets.minPrice)}
              aria-label="Minimum price"
              className="input !min-h-10 !px-2.5 !py-1.5 text-sm"
            />
            <span className="text-muted">–</span>
            <input
              name="max"
              inputMode="numeric"
              defaultValue={state.max}
              placeholder={String(facets.maxPrice)}
              aria-label="Maximum price"
              className="input !min-h-10 !px-2.5 !py-1.5 text-sm"
            />
            <button type="submit" className="btn btn-outline btn-sm !px-3">
              Go
            </button>
          </form>
          <p className="mt-2 text-xs text-muted">
            {money(facets.minPrice)} – {money(facets.maxPrice)}
          </p>
        </div>
      )}

      {hasFilters && (
        <button
          type="button"
          onClick={() => update({ q: "", sizes: [], colors: [], min: "", max: "" })}
          className="text-xs uppercase tracking-[0.14em] text-muted underline underline-offset-4 hover:text-fg"
        >
          Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* Toolbar */}
      <div className="col-span-full mb-8 flex items-center justify-between gap-4 border-y border-line py-3">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] lg:hidden"
          >
            <SlidersHorizontal size={16} strokeWidth={1.5} />
            Filter{activeCount > 0 && ` (${activeCount})`}
          </button>
          <p className={cn("text-sm text-muted transition-opacity", pending && "opacity-40")} aria-live="polite">
            {total} {total === 1 ? "piece" : "pieces"}
            {state.q && (
              <>
                {" "}
                for <span className="text-fg">“{state.q}”</span>
              </>
            )}
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <span className="hidden text-muted sm:inline">Sort by</span>
          <select
            value={state.sort}
            onChange={(event) => update({ sort: event.target.value })}
            aria-label="Sort products"
            className="bg-transparent py-1.5 pr-1 text-sm font-medium outline-none"
          >
            {SORTS.map((sort) => (
              <option key={sort.value} value={sort.value} className="text-black">
                {sort.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block" aria-label="Filters">
        <div className="sticky top-28">{panel}</div>
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <button type="button" aria-label="Close filters" className="animate-fade-in absolute inset-0 bg-black/45" onClick={() => setOpen(false)} />
          <div className="animate-slide-left absolute inset-y-0 left-0 flex w-[86%] max-w-sm flex-col bg-bg">
            <div className="flex h-16 items-center justify-between border-b border-line px-5">
              <span className="text-sm font-medium uppercase tracking-[0.14em]">Filter</span>
              <button type="button" aria-label="Close filters" onClick={() => setOpen(false)} className="p-2">
                <X size={22} strokeWidth={1.4} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">{panel}</div>
            <div className="border-t border-line p-5">
              <button type="button" onClick={() => setOpen(false)} className="btn btn-primary btn-block">
                Show {total} {total === 1 ? "piece" : "pieces"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function paginationHref(basePath: string, state: ListingState, page: number) {
  const href = buildHref(basePath, state);
  if (page <= 1) return href;
  return `${href}${href.includes("?") ? "&" : "?"}page=${page}`;
}
