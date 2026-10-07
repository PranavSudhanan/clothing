import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageBuilder, type PageDraft } from "@/components/admin/page-builder";
import { adminPage, adminRefs } from "@/lib/admin-data";

export const metadata: Metadata = { title: "Edit page" };
export const instant = false;

const BLANK: PageDraft = {
  title: "",
  slug: "",
  seoTitle: "",
  seoDescription: "",
  published: true,
  system: false,
  sections: [],
};

export default async function PageEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const refs = await adminRefs();

  if (id === "new") return <PageBuilder initial={BLANK} refs={refs} />;

  const page = await adminPage(id);
  if (!page) notFound();

  return (
    <PageBuilder
      key={page.id}
      refs={refs}
      initial={{
        id: page.id,
        title: page.title,
        slug: page.slug,
        seoTitle: page.seoTitle,
        seoDescription: page.seoDescription,
        published: page.published,
        system: page.system,
        sections: page.sections,
      }}
    />
  );
}
