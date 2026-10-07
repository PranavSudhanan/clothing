import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductEditor, type ProductDraft } from "@/components/admin/product-editor";
import { adminCategories, adminProduct } from "@/lib/admin-data";

export const metadata: Metadata = { title: "Product" };
export const instant = false;

const BLANK: ProductDraft = {
  name: "",
  slug: "",
  description: "",
  categoryId: null,
  price: 0,
  compareAtPrice: null,
  images: [],
  sizes: ["S", "M", "L", "XL"],
  colors: [],
  tags: [],
  fabric: "",
  fit: "",
  care: "",
  featured: false,
  isNew: true,
  status: "active",
  seoTitle: "",
  seoDescription: "",
};

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const categories = (await adminCategories()).map((c) => ({ id: c.id, name: c.name }));

  if (id === "new") return <ProductEditor initial={BLANK} variants={[]} categories={categories} />;

  const product = await adminProduct(id);
  if (!product) notFound();
  const { variants, createdAt: _createdAt, updatedAt: _updatedAt, ...fields } = product;

  return (
    <ProductEditor
      key={product.id}
      initial={fields}
      variants={variants.map((v) => ({ size: v.size, color: v.color, sku: v.sku, stock: v.stock }))}
      categories={categories}
    />
  );
}
