import Link from "next/link";
import { getCategories, getCategory, getFacets, getProducts, type ProductQuery } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Filters, type ListingState } from "./filters";
import { ProductGrid, ProductGridSkeleton } from "./product-card";
import { Breadcrumbs, EmptyState } from "./ui";

export type SearchParams = Record<string, string | string[] | undefined>;

const PER_PAGE = 12;
const SORTS = ["featured", "newest", "price-asc", "price-desc", "name"] as const;

const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";
const many = (value: string | string[] | undefined) =>
  one(value)
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean)
    .slice(0, 12);
const price = (value: string) => (/^\d+(\.\d+)?$/.test(value) ? value : "");

function hrefFor(basePath: string, state: ListingState, page: number) {
  const params = new URLSearchParams();
  if (state.q) params.set("q", state.q);
  if (state.sizes.length) params.set("size", state.sizes.join(","));
  if (state.colors.length) params.set("color", state.colors.join(","));
  if (state.min) params.set("min", state.min);
  if (state.max) params.set("max", state.max);
  if (state.sort !== "featured") params.set("sort", state.sort);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function ListingSkeleton() {
  return (
    <div className="container-page py-10 md:py-14">
      <div className="skeleton h-3 w-40" />
      <div className="skeleton mt-6 h-12 w-72 max-w-full" />
      <div className="mt-10 gap-12 lg:grid lg:grid-cols-[14rem_minmax(0,1fr)]">
        <div className="hidden space-y-4 lg:block">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="skeleton h-4" style={{ width: `${55 + ((i * 17) % 40)}%` }} />
          ))}
        </div>
        <ProductGridSkeleton count={8} />
      </div>
    </div>
  );
}

export async function Listing({
  searchParams,
  params,
}: {
  searchParams: Promise<SearchParams>;
  params?: Promise<{ slug: string }>;
}) {
  const [search, route] = await Promise.all([searchParams, params]);
  const categorySlug = route?.slug;

  const sort = (SORTS as readonly string[]).includes(one(search.sort)) ? one(search.sort) : "featured";
  const state: ListingState = {
    q: one(search.q).slice(0, 80),
    sizes: many(search.size),
    colors: many(search.color),
    min: price(one(search.min)),
    max: price(one(search.max)),
    sort,
  };
  const page = Math.max(1, Number.parseInt(one(search.page), 10) || 1);

  const query: ProductQuery = {
    category: categorySlug,
    q: state.q || undefined,
    sizes: state.sizes.length ? state.sizes : undefined,
    colors: state.colors.length ? state.colors : undefined,
    min: state.min ? Number(state.min) : undefined,
    max: state.max ? Number(state.max) : undefined,
    sort: sort as ProductQuery["sort"],
    page,
    perPage: PER_PAGE,
  };

  const [category, categories, facets, result] = await Promise.all([
    categorySlug ? getCategory(categorySlug) : null,
    getCategories(),
    getFacets(categorySlug),
    getProducts(query),
  ]);

  if (categorySlug && !category) {
    return (
      <div className="container-page">
        <EmptyState
          title="Collection not found"
          text="This collection may have been renamed or removed."
          action={
            <Link href="/shop" className="btn btn-primary">
              Shop everything
            </Link>
          }
        />
      </div>
    );
  }

  const basePath = category ? `/collections/${category.slug}` : "/shop";
  const title = category?.name ?? (state.q ? "Search results" : "All ready-to-wear");
  const description =
    category?.description ?? (state.q ? "" : "Every piece in the collection — in stock and ready to ship.");
  const pages = Math.max(1, Math.ceil(result.total / PER_PAGE));

  return (
    <div className="container-page py-10 md:py-14">
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: "Shop", href: category ? "/shop" : undefined }, ...(category ? [{ label: category.name }] : [])]}
      />
      <header className="mb-10 mt-6 max-w-2xl">
        <h1 className="text-4xl md:text-6xl">{title}</h1>
        {description && <p className="mt-4 leading-relaxed text-muted">{description}</p>}
      </header>

      <div className="gap-x-12 lg:grid lg:grid-cols-[14rem_minmax(0,1fr)]">
        <Filters
          basePath={basePath}
          state={state}
          facets={facets}
          total={result.total}
          categories={categories.map((c) => ({ name: c.name, slug: c.slug }))}
          activeCategory={category?.slug}
        />

        <div>
          {result.items.length === 0 ? (
            <EmptyState
              title="Nothing matches yet"
              text="Try removing a filter or searching for something else."
              action={
                <Link href={basePath} className="btn btn-outline">
                  Clear filters
                </Link>
              }
            />
          ) : (
            <ProductGrid products={result.items} />
          )}

          {pages > 1 && (
            <nav aria-label="Pagination" className="mt-16 flex items-center justify-center gap-1.5">
              {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                <Link
                  key={n}
                  href={hrefFor(basePath, state, n)}
                  aria-current={n === page ? "page" : undefined}
                  className={cn(
                    "flex h-10 min-w-10 items-center justify-center border px-2 text-sm transition-colors",
                    n === page ? "border-fg bg-fg text-bg" : "border-line hover:border-fg",
                  )}
                  style={{ borderRadius: "var(--radius)" }}
                >
                  {n}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
