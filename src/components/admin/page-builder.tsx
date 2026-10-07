"use client";

import { ArrowDown, ArrowLeft, ArrowUp, ChevronDown, Copy, ExternalLink, Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deletePageAction, savePageAction } from "@/lib/actions/admin";
import type { FieldValues } from "@/lib/fields";
import { COMMON_SECTION_FIELDS, newSection, SECTION_DEFINITIONS, sectionDefinition } from "@/lib/sections";
import type { Section } from "@/lib/types";
import { cn, uid } from "@/lib/utils";
import { FieldsForm, type Refs } from "./fields-form";
import { Card, Modal, Toggle, useToast } from "./ui";

export type PageDraft = {
  id?: string;
  title: string;
  slug: string;
  seoTitle: string;
  seoDescription: string;
  published: boolean;
  system: boolean;
  sections: Section[];
};

function summary(section: Section) {
  const data = section.data;
  const text = [data.title, data.eyebrow, data.placement].find((v) => typeof v === "string" && v.trim());
  if (text) return String(text);
  if (Array.isArray(data.items)) return `${data.items.length} ${data.items.length === 1 ? "item" : "items"}`;
  return "";
}

export function PageBuilder({ initial, refs }: { initial: PageDraft; refs: Refs }) {
  const router = useRouter();
  const toast = useToast();
  const [page, setPage] = useState<PageDraft>(initial);
  const [open, setOpen] = useState<string | null>(null);
  const [catalog, setCatalog] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [pending, start] = useTransition();

  const change = (patch: Partial<PageDraft>) => {
    setPage((current) => ({ ...current, ...patch }));
    setDirty(true);
  };
  const setSections = (sections: Section[]) => change({ sections });
  const updateSection = (id: string, patch: Partial<Section>) =>
    setSections(page.sections.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const move = (index: number, to: number) => {
    if (to < 0 || to >= page.sections.length) return;
    const next = [...page.sections];
    [next[index], next[to]] = [next[to], next[index]];
    setSections(next);
  };

  function add(type: string) {
    const section = newSection(type, uid());
    setSections([...page.sections, section]);
    setOpen(section.id);
    setCatalog(false);
  }

  function save() {
    start(async () => {
      const result = await savePageAction(page);
      toast(result);
      if (!result.ok) return;
      setDirty(false);
      if (!page.id && result.data) router.replace(`/admin/pages/${result.data.id}`);
      else router.refresh();
    });
  }

  function remove() {
    if (!page.id || !window.confirm(`Delete the page “${page.title}”? This cannot be undone.`)) return;
    start(async () => {
      const result = await deletePageAction(page.id!);
      toast(result);
      if (result.ok) router.push("/admin/pages");
    });
  }

  const liveHref = page.slug === "home" ? "/" : `/${page.slug}`;

  return (
    <>
      <Link href="/admin/pages" className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-zinc-500 hover:text-zinc-900">
        <ArrowLeft size={14} /> Pages
      </Link>
      <div className="sticky top-14 z-20 -mx-4 mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 bg-[#f6f6f7]/95 px-4 py-3 backdrop-blur md:-mx-8 md:px-8 lg:top-0">
        <div className="min-w-0">
          <h1 className="truncate text-[20px] font-semibold tracking-tight">{page.title || "New page"}</h1>
          <p className="text-xs text-zinc-500">{dirty ? "Unsaved changes" : page.id ? "All changes saved" : "Not saved yet"}</p>
        </div>
        <div className="flex gap-2">
          {page.id && (
            <a href={liveHref} target="_blank" rel="noopener noreferrer" className="a-btn">
              <ExternalLink size={15} /> View page
            </a>
          )}
          {page.id && !page.system && (
            <button type="button" disabled={pending} onClick={remove} className="a-btn a-btn-danger">
              <Trash2 size={15} /> Delete
            </button>
          )}
          <button type="button" disabled={pending} onClick={save} className="a-btn a-btn-primary">
            {pending ? "Saving…" : "Save page"}
          </button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[13px] font-medium text-zinc-600">
              Sections <span className="font-normal text-zinc-400">· shown top to bottom</span>
            </p>
          </div>

          {page.sections.length === 0 && (
            <div className="a-card px-5 py-12 text-center text-[13.5px] text-zinc-500">This page is empty. Add your first section below.</div>
          )}

          <ul className="space-y-2.5">
            {page.sections.map((section, index) => {
              const definition = sectionDefinition(section.type);
              const expanded = open === section.id;
              return (
                <li key={section.id} className={cn("a-card overflow-hidden", !section.enabled && "opacity-60")}>
                  <div className="flex items-center gap-1.5 px-3 py-2.5">
                    <div className="flex flex-col">
                      <button type="button" aria-label="Move up" disabled={index === 0} onClick={() => move(index, index - 1)} className="rounded p-0.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-30">
                        <ArrowUp size={14} />
                      </button>
                      <button
                        type="button"
                        aria-label="Move down"
                        disabled={index === page.sections.length - 1}
                        onClick={() => move(index, index + 1)}
                        className="rounded p-0.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-30"
                      >
                        <ArrowDown size={14} />
                      </button>
                    </div>
                    <button type="button" onClick={() => setOpen(expanded ? null : section.id)} className="flex min-w-0 flex-1 items-center gap-2.5 px-1.5 py-1 text-left">
                      <ChevronDown size={16} className={cn("shrink-0 text-zinc-400 transition-transform", !expanded && "-rotate-90")} />
                      <span className="min-w-0">
                        <span className="block text-[14px] font-medium">{definition?.label ?? section.type}</span>
                        <span className="block truncate text-xs text-zinc-500">{summary(section) || definition?.description}</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      aria-label={section.enabled ? "Hide section" : "Show section"}
                      title={section.enabled ? "Visible — click to hide" : "Hidden — click to show"}
                      onClick={() => updateSection(section.id, { enabled: !section.enabled })}
                      className="a-btn a-btn-ghost a-btn-icon"
                    >
                      {section.enabled ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                    <button
                      type="button"
                      aria-label="Duplicate section"
                      title="Duplicate"
                      onClick={() => {
                        const copy = { ...structuredClone(section), id: uid() };
                        const next = [...page.sections];
                        next.splice(index + 1, 0, copy);
                        setSections(next);
                      }}
                      className="a-btn a-btn-ghost a-btn-icon"
                    >
                      <Copy size={15} />
                    </button>
                    <button
                      type="button"
                      aria-label="Delete section"
                      title="Delete"
                      onClick={() => {
                        if (window.confirm("Remove this section from the page?")) setSections(page.sections.filter((s) => s.id !== section.id));
                      }}
                      className="a-btn a-btn-ghost a-btn-icon text-red-600"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  {expanded && definition && (
                    <div className="border-t border-zinc-100 bg-zinc-50/50 p-4">
                      <FieldsForm
                        fields={[...definition.fields, ...COMMON_SECTION_FIELDS]}
                        values={section.data as FieldValues}
                        refs={refs}
                        onChange={(data) => updateSection(section.id, { data })}
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          <button
            type="button"
            onClick={() => setCatalog(true)}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 bg-white py-3.5 text-[13.5px] font-medium text-zinc-600 transition hover:border-zinc-900 hover:text-zinc-900"
          >
            <Plus size={16} /> Add section
          </button>
        </div>

        <div className="space-y-5">
          <Card title="Page settings">
            <div className="space-y-4">
              <div>
                <label className="a-label" htmlFor="page-title">
                  Title
                </label>
                <input id="page-title" value={page.title} onChange={(e) => change({ title: e.target.value })} className="a-input" />
              </div>
              <div>
                <label className="a-label" htmlFor="page-slug">
                  URL
                </label>
                <div className="flex items-center">
                  <span className="flex h-[38px] items-center rounded-l-lg border border-r-0 border-zinc-300 bg-zinc-50 px-2.5 text-sm text-zinc-500">/</span>
                  <input
                    id="page-slug"
                    value={page.system ? (page.slug === "home" ? "" : page.slug) : page.slug}
                    disabled={page.system}
                    onChange={(e) => change({ slug: e.target.value })}
                    placeholder={page.system ? "" : "generated from the title"}
                    className="a-input !rounded-l-none disabled:bg-zinc-50 disabled:text-zinc-500"
                  />
                </div>
                {page.system && <p className="a-help">This is a built-in page, so its address is fixed.</p>}
              </div>
              {!page.system && (
                <label className="flex items-center justify-between gap-3 text-[13.5px]">
                  <span>
                    <span className="block font-medium">Published</span>
                    <span className="text-xs text-zinc-500">Unpublished pages return “not found”</span>
                  </span>
                  <Toggle checked={page.published} onChange={(published) => change({ published })} label="Published" />
                </label>
              )}
            </div>
          </Card>
          <Card title="Search engine listing">
            <div className="space-y-4">
              <div>
                <label className="a-label" htmlFor="page-seo-title">
                  Search title
                </label>
                <input id="page-seo-title" value={page.seoTitle} onChange={(e) => change({ seoTitle: e.target.value })} placeholder={page.title} className="a-input" />
              </div>
              <div>
                <label className="a-label" htmlFor="page-seo-description">
                  Search description
                </label>
                <textarea id="page-seo-description" value={page.seoDescription} onChange={(e) => change({ seoDescription: e.target.value })} rows={3} className="a-input" />
              </div>
              {page.slug === "home" && <p className="a-help">The home page title and description are set under Settings → SEO.</p>}
            </div>
          </Card>
        </div>
      </div>

      <Modal open={catalog} title="Add a section" onClose={() => setCatalog(false)}>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {SECTION_DEFINITIONS.map((definition) => (
            <button
              key={definition.type}
              type="button"
              onClick={() => add(definition.type)}
              className="rounded-xl border border-zinc-200 p-3.5 text-left transition hover:border-zinc-900 hover:bg-zinc-50"
            >
              <span className="block text-[14px] font-medium">{definition.label}</span>
              <span className="mt-0.5 block text-[13px] leading-snug text-zinc-500">{definition.description}</span>
            </button>
          ))}
        </div>
      </Modal>
    </>
  );
}
