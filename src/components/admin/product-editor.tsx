"use client";

import { ArrowLeft, ExternalLink, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { deleteProductAction, saveProductAction } from "@/lib/actions/admin";
import type { Field, FieldValues } from "@/lib/fields";
import type { ColorOption } from "@/lib/types";
import { FieldsForm } from "./fields-form";
import { Card, Toggle, useToast } from "./ui";

const BASIC: Field[] = [
  { name: "name", label: "Name", type: "text", required: true },
  { name: "description", label: "Description", type: "markdown" },
];
const MEDIA: Field[] = [{ name: "images", label: "Images", type: "images", help: "The first image is the main one. Portrait photos (3:4) look best." }];
const PRICING: Field[] = [
  { name: "price", label: "Price", type: "number", width: "half", required: true },
  { name: "compareAtPrice", label: "Compare-at price", type: "number", width: "half", help: "The original price. Shows a strike-through and a sale badge. 0 = none." },
];
const OPTIONS: Field[] = [
  { name: "sizes", label: "Sizes", type: "tags", placeholder: "S, M, L, XL — press Enter after each", help: "Leave empty for one-size products" },
  {
    name: "colors",
    label: "Colours",
    type: "list",
    itemLabel: "colour",
    titleKey: "name",
    fields: [
      { name: "name", label: "Name", type: "text", width: "half", placeholder: "Navy" },
      { name: "hex", label: "Swatch", type: "color", width: "half" },
    ],
  },
];
const DETAILS: Field[] = [
  { name: "fabric", label: "Fabric", type: "text", placeholder: "100% Supima cotton" },
  { name: "fit", label: "Fit", type: "text", placeholder: "Slim fit — true to size" },
  { name: "care", label: "Care instructions", type: "textarea" },
];
const SEO: Field[] = [
  { name: "slug", label: "URL slug", type: "text", help: "Leave empty to generate from the name" },
  { name: "seoTitle", label: "Search title", type: "text", help: "Defaults to the product name" },
  { name: "seoDescription", label: "Search description", type: "textarea" },
];
const TAGS: Field[] = [{ name: "tags", label: "Tags", type: "tags", help: "Used by search" }];

export type ProductDraft = FieldValues & {
  id?: string;
  slug: string;
  status: "active" | "draft";
  categoryId: string | null;
  featured: boolean;
  isNew: boolean;
  sizes: string[];
  colors: ColorOption[];
};

type Stock = Record<string, { stock: number; sku: string }>;
const keyOf = (size: string, color: string) => `${size}|||${color}`;

export function ProductEditor({
  initial,
  variants,
  categories,
}: {
  initial: ProductDraft;
  variants: { size: string; color: string; sku: string; stock: number }[];
  categories: { id: string; name: string }[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [values, setValues] = useState<ProductDraft>(initial);
  const [stock, setStock] = useState<Stock>(() => Object.fromEntries(variants.map((v) => [keyOf(v.size, v.color), { stock: v.stock, sku: v.sku }])));
  const [bulk, setBulk] = useState("");
  const [pending, start] = useTransition();
  const patch = (next: FieldValues) => setValues(next as ProductDraft);

  const combos = useMemo(() => {
    const sizes = values.sizes.length ? values.sizes : [""];
    const colors = values.colors.filter((c) => c.name?.trim()).map((c) => c.name.trim());
    return sizes.flatMap((size) => (colors.length ? colors : [""]).map((color) => ({ size, color })));
  }, [values.sizes, values.colors]);

  const totalStock = combos.reduce((sum, c) => sum + (stock[keyOf(c.size, c.color)]?.stock ?? 0), 0);

  function save() {
    start(async () => {
      const result = await saveProductAction({
        ...values,
        colors: values.colors.filter((c) => c.name?.trim()).map((c) => ({ name: c.name.trim(), hex: c.hex || "#000000" })),
        variants: combos.map((c) => ({ ...c, sku: stock[keyOf(c.size, c.color)]?.sku ?? "", stock: stock[keyOf(c.size, c.color)]?.stock ?? 0 })),
      });
      toast(result);
      if (!result.ok) return;
      if (!values.id && result.data) router.replace(`/admin/products/${result.data.id}`);
      else router.refresh();
    });
  }

  function remove() {
    if (!values.id || !window.confirm(`Delete “${String(values.name)}”? This cannot be undone.`)) return;
    start(async () => {
      const result = await deleteProductAction(values.id!);
      toast(result);
      if (result.ok) router.push("/admin/products");
    });
  }

  return (
    <>
      <Link href="/admin/products" className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-zinc-500 hover:text-zinc-900">
        <ArrowLeft size={14} /> Products
      </Link>
      <div className="sticky top-14 z-20 -mx-4 mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 bg-[#f6f6f7]/95 px-4 py-3 backdrop-blur md:-mx-8 md:px-8 lg:top-0">
        <h1 className="min-w-0 truncate text-[20px] font-semibold tracking-tight">{values.id ? String(values.name) || "Untitled product" : "New product"}</h1>
        <div className="flex gap-2">
          {values.id && values.status === "active" && (
            <a href={`/product/${values.slug}`} target="_blank" rel="noopener noreferrer" className="a-btn">
              <ExternalLink size={15} /> View
            </a>
          )}
          {values.id && (
            <button type="button" disabled={pending} onClick={remove} className="a-btn a-btn-danger">
              <Trash2 size={15} /> Delete
            </button>
          )}
          <button type="button" disabled={pending} onClick={save} className="a-btn a-btn-primary">
            {pending ? "Saving…" : "Save product"}
          </button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-5">
          <Card>
            <FieldsForm fields={BASIC} values={values} onChange={patch} />
          </Card>
          <Card title="Media">
            <FieldsForm fields={MEDIA} values={values} onChange={patch} />
          </Card>
          <Card title="Pricing">
            <FieldsForm fields={PRICING} values={values} onChange={patch} />
          </Card>
          <Card title="Sizes & colours" description="Stock is tracked for every size and colour combination.">
            <FieldsForm fields={OPTIONS} values={values} onChange={patch} />

            <div className="mt-6 border-t border-zinc-100 pt-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-[13px] font-medium text-zinc-700">
                  Inventory <span className="font-normal text-zinc-500">· {combos.length} variants · {totalStock} units</span>
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={bulk}
                    onChange={(e) => setBulk(e.target.value)}
                    placeholder="Qty"
                    aria-label="Stock quantity for all variants"
                    className="a-input !min-h-8 !w-20 !py-1"
                  />
                  <button
                    type="button"
                    disabled={bulk === ""}
                    onClick={() => {
                      const qty = Math.max(0, Math.floor(Number(bulk) || 0));
                      setStock((current) =>
                        Object.fromEntries(combos.map((c) => [keyOf(c.size, c.color), { sku: current[keyOf(c.size, c.color)]?.sku ?? "", stock: qty }])),
                      );
                    }}
                    className="a-btn !min-h-8"
                  >
                    Set all
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto rounded-lg border border-zinc-200">
                <table className="a-table">
                  <thead>
                    <tr>
                      <th>Variant</th>
                      <th>SKU</th>
                      <th className="w-28">In stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {combos.map((combo) => {
                      const key = keyOf(combo.size, combo.color);
                      const row = stock[key] ?? { stock: 0, sku: "" };
                      const swatch = values.colors.find((c) => c.name?.trim() === combo.color)?.hex;
                      return (
                        <tr key={key}>
                          <td>
                            <span className="flex items-center gap-2">
                              {swatch && <span className="h-3.5 w-3.5 rounded-full border border-black/10" style={{ background: swatch }} />}
                              {[combo.color, combo.size].filter(Boolean).join(" / ") || "Default"}
                            </span>
                          </td>
                          <td>
                            <input
                              value={row.sku}
                              onChange={(e) => setStock({ ...stock, [key]: { ...row, sku: e.target.value } })}
                              placeholder="Optional"
                              aria-label="SKU"
                              className="a-input !min-h-8 !py-1"
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              min="0"
                              value={row.stock}
                              onChange={(e) => setStock({ ...stock, [key]: { ...row, stock: Math.max(0, Math.floor(Number(e.target.value) || 0)) } })}
                              aria-label="Stock"
                              className="a-input !min-h-8 !py-1"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
          <Card title="Details" description="Shown in the accordions on the product page.">
            <FieldsForm fields={DETAILS} values={values} onChange={patch} />
          </Card>
          <Card title="Search engine listing">
            <FieldsForm fields={SEO} values={values} onChange={patch} />
          </Card>
        </div>

        <div className="space-y-5">
          <Card title="Status">
            <select value={values.status} onChange={(e) => setValues({ ...values, status: e.target.value as "active" | "draft" })} className="a-input" aria-label="Status">
              <option value="active">Active — visible in the store</option>
              <option value="draft">Draft — hidden</option>
            </select>
          </Card>
          <Card title="Organisation">
            <label className="a-label" htmlFor="product-category">
              Category
            </label>
            <select
              id="product-category"
              value={values.categoryId ?? ""}
              onChange={(e) => setValues({ ...values, categoryId: e.target.value || null })}
              className="a-input"
            >
              <option value="">No category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <div className="mt-4">
              <FieldsForm fields={TAGS} values={values} onChange={patch} />
            </div>
          </Card>
          <Card title="Merchandising">
            <div className="space-y-3.5">
              <label className="flex items-center justify-between gap-3 text-[13.5px]">
                <span>
                  <span className="block font-medium">Featured</span>
                  <span className="text-xs text-zinc-500">Appears in “Featured products” sections</span>
                </span>
                <Toggle checked={values.featured} onChange={(featured) => setValues({ ...values, featured })} label="Featured" />
              </label>
              <label className="flex items-center justify-between gap-3 text-[13.5px]">
                <span>
                  <span className="block font-medium">New arrival</span>
                  <span className="text-xs text-zinc-500">Shows a “New” badge</span>
                </span>
                <Toggle checked={values.isNew} onChange={(isNew) => setValues({ ...values, isNew })} label="New arrival" />
              </label>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
