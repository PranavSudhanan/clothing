"use client";

import { ArrowDown, ArrowUp, ChevronDown, Plus, Trash2, X } from "lucide-react";
import { useId, useState } from "react";
import { emptyValues, fieldVisible, type Field, type FieldValues } from "@/lib/fields";
import { MEASUREMENT_FIELDS } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ImageInput, ImagesInput } from "./image-input";
import { Toggle } from "./ui";

export type Refs = {
  categories?: { slug: string; name: string }[];
  products?: { id: string; name: string; image: string }[];
  fabrics?: { id: string; name: string; hex: string }[];
  placements?: string[];
};

type ControlProps = { field: Field; value: unknown; onChange: (value: unknown) => void; refs?: Refs; id: string };

const asString = (value: unknown) => (typeof value === "string" ? value : value == null ? "" : String(value));
const asArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

/** <input type="datetime-local"> works in local time; values are stored as ISO strings. */
function toLocalInput(value: unknown) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function TagsControl({ value, onChange, placeholder }: { value: string[]; onChange: (tags: string[]) => void; placeholder?: string }) {
  const [draft, setDraft] = useState("");
  const commit = () => {
    const tags = draft
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t && !value.includes(t));
    if (tags.length) onChange([...value, ...tags]);
    setDraft("");
  };
  return (
    <div className="a-input flex flex-wrap items-center gap-1.5 !py-1.5">
      {value.map((tag) => (
        <span key={tag} className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 text-[13px]">
          {tag}
          <button type="button" aria-label={`Remove ${tag}`} onClick={() => onChange(value.filter((t) => t !== tag))} className="text-zinc-400 hover:text-zinc-900">
            <X size={12} />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            commit();
          } else if (e.key === "Backspace" && !draft && value.length) {
            onChange(value.slice(0, -1));
          }
        }}
        placeholder={value.length ? "" : (placeholder ?? "Type and press Enter")}
        className="min-w-[8rem] flex-1 bg-transparent py-0.5 text-sm outline-none"
      />
    </div>
  );
}

function Checklist({
  options,
  value,
  onChange,
  searchable = false,
}: {
  options: { id: string; label: string; image?: string; hex?: string }[];
  value: string[];
  onChange: (ids: string[]) => void;
  searchable?: boolean;
}) {
  const [query, setQuery] = useState("");
  const shown = query ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase())) : options;
  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);

  return (
    <div className="rounded-lg border border-zinc-200">
      {searchable && (
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search…" className="w-full border-b border-zinc-200 bg-transparent px-3 py-2 text-sm outline-none" />
      )}
      <div className="max-h-60 overflow-y-auto p-1.5">
        {shown.length === 0 && <p className="px-2 py-3 text-[13px] text-zinc-500">Nothing to choose from yet.</p>}
        {shown.map((option) => (
          <label key={option.id} className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-[13.5px] hover:bg-zinc-50">
            <input type="checkbox" checked={value.includes(option.id)} onChange={() => toggle(option.id)} className="h-4 w-4 accent-zinc-900" />
            {option.image !== undefined &&
              (option.image ? (
                <img src={option.image} alt="" loading="lazy" className="h-8 w-6 rounded object-cover" />
              ) : (
                <span className="h-8 w-6 rounded bg-zinc-100" />
              ))}
            {option.hex && <span className="h-4 w-4 rounded-full border border-black/10" style={{ background: option.hex }} />}
            <span className="truncate">{option.label}</span>
          </label>
        ))}
      </div>
      <p className="border-t border-zinc-100 px-3 py-1.5 text-xs text-zinc-500">{value.length} selected</p>
    </div>
  );
}

function ListControl({ field, value, onChange, refs }: Omit<ControlProps, "id">) {
  const items = asArray<FieldValues>(value);
  const subFields = field.fields ?? [];
  const [open, setOpen] = useState<number | null>(null);

  const update = (next: FieldValues[]) => onChange(next);
  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    [next[from], next[to]] = [next[to], next[from]];
    update(next);
    setOpen(open === from ? to : open === to ? from : open);
  };

  return (
    <div>
      {items.length > 0 && (
        <ul className="mb-2 space-y-2">
          {items.map((item, i) => {
            const title = asString(item[field.titleKey ?? ""]).slice(0, 80) || `${field.itemLabel ?? "Item"} ${i + 1}`;
            const expanded = open === i;
            return (
              <li key={i} className="rounded-lg border border-zinc-200 bg-white">
                <div className="flex items-center gap-1 px-2 py-1.5">
                  <button type="button" onClick={() => setOpen(expanded ? null : i)} className="flex min-w-0 flex-1 items-center gap-2 px-1 py-1 text-left text-[13.5px] font-medium">
                    <ChevronDown size={15} className={cn("shrink-0 text-zinc-400 transition-transform", !expanded && "-rotate-90")} />
                    <span className="truncate">{title}</span>
                  </button>
                  <button type="button" aria-label="Move up" disabled={i === 0} onClick={() => move(i, i - 1)} className="a-btn a-btn-ghost a-btn-icon !min-h-7 !w-7">
                    <ArrowUp size={14} />
                  </button>
                  <button type="button" aria-label="Move down" disabled={i === items.length - 1} onClick={() => move(i, i + 1)} className="a-btn a-btn-ghost a-btn-icon !min-h-7 !w-7">
                    <ArrowDown size={14} />
                  </button>
                  <button
                    type="button"
                    aria-label="Remove"
                    onClick={() => {
                      update(items.filter((_, idx) => idx !== i));
                      setOpen(null);
                    }}
                    className="a-btn a-btn-ghost a-btn-icon !min-h-7 !w-7 text-red-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                {expanded && (
                  <div className="border-t border-zinc-100 bg-zinc-50/60 p-3.5">
                    <FieldsForm fields={subFields} values={item} refs={refs} onChange={(next) => update(items.map((it, idx) => (idx === i ? next : it)))} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <button
        type="button"
        onClick={() => {
          update([...items, emptyValues(subFields)]);
          setOpen(items.length);
        }}
        className="a-btn"
      >
        <Plus size={14} /> Add {field.itemLabel ?? "item"}
      </button>
    </div>
  );
}

function Control({ field, value, onChange, refs, id }: ControlProps) {
  switch (field.type) {
    case "textarea":
      return <textarea id={id} value={asString(value)} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} rows={3} className="a-input" />;
    case "markdown":
      return (
        <>
          <textarea id={id} value={asString(value)} onChange={(e) => onChange(e.target.value)} rows={8} className="a-input font-mono !text-[13px]" />
          <p className="a-help">Markdown: **bold**, *italic*, ## heading, - list, [link](https://…)</p>
        </>
      );
    case "number":
      return (
        <input
          id={id}
          type="number"
          step="any"
          value={value === null || value === undefined ? "" : asString(value)}
          onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
          placeholder={field.placeholder}
          className="a-input"
        />
      );
    case "boolean":
      return <Toggle checked={Boolean(value)} onChange={onChange} label={field.label} />;
    case "color": {
      const current = asString(value) || "#000000";
      return (
        <div className="flex gap-2">
          <input
            type="color"
            aria-label={`${field.label} picker`}
            value={/^#[0-9a-fA-F]{6}$/.test(current) ? current : "#000000"}
            onChange={(e) => onChange(e.target.value)}
            className="h-[38px] w-11 shrink-0 cursor-pointer rounded-lg border border-zinc-300 bg-white p-1"
          />
          <input id={id} value={current} onChange={(e) => onChange(e.target.value)} className="a-input font-mono" />
        </div>
      );
    }
    case "image":
      return <ImageInput value={asString(value)} onChange={onChange} />;
    case "images":
      return <ImagesInput value={asArray<string>(value)} onChange={onChange} />;
    case "select":
      return (
        <select id={id} value={asString(value)} onChange={(e) => onChange(e.target.value)} className="a-input">
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    case "tags":
      return <TagsControl value={asArray<string>(value)} onChange={onChange} placeholder={field.placeholder} />;
    case "datetime":
      return (
        <input
          id={id}
          type="datetime-local"
          value={toLocalInput(value)}
          onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : null)}
          className="a-input"
        />
      );
    case "list":
      return <ListControl field={field} value={value} onChange={onChange} refs={refs} />;
    case "category":
      return (
        <select id={id} value={asString(value)} onChange={(e) => onChange(e.target.value)} className="a-input">
          <option value="">Choose a category…</option>
          {refs?.categories?.map((category) => (
            <option key={category.slug} value={category.slug}>
              {category.name}
            </option>
          ))}
        </select>
      );
    case "products":
      return (
        <Checklist
          searchable
          value={asArray<string>(value)}
          onChange={onChange}
          options={(refs?.products ?? []).map((p) => ({ id: p.id, label: p.name, image: p.image }))}
        />
      );
    case "fabrics":
      return (
        <Checklist value={asArray<string>(value)} onChange={onChange} options={(refs?.fabrics ?? []).map((f) => ({ id: f.id, label: f.name, hex: f.hex }))} />
      );
    case "measurements":
      return (
        <Checklist
          value={asArray<string>(value)}
          onChange={onChange}
          options={Object.entries(MEASUREMENT_FIELDS).map(([key, meta]) => ({ id: key, label: meta.label }))}
        />
      );
    case "placement": {
      const listId = `${id}-list`;
      return (
        <>
          <input id={id} list={listId} value={asString(value)} onChange={(e) => onChange(e.target.value)} placeholder="home-hero" className="a-input" />
          <datalist id={listId}>
            {[...new Set(["home-hero", "couture-hero", ...(refs?.placements ?? [])])].map((placement) => (
              <option key={placement} value={placement} />
            ))}
          </datalist>
        </>
      );
    }
    default:
      return (
        <input
          id={id}
          type="text"
          value={asString(value)}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder ?? (field.type === "link" ? "/shop or https://…" : undefined)}
          className="a-input"
        />
      );
  }
}

const SPAN = { full: "sm:col-span-6", half: "sm:col-span-3", third: "sm:col-span-2" };

export function FieldsForm({
  fields,
  values,
  onChange,
  refs,
}: {
  fields: Field[];
  values: FieldValues;
  onChange: (values: FieldValues) => void;
  refs?: Refs;
}) {
  const baseId = useId();
  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-6">
      {fields.map((field) => {
        if (!fieldVisible(field, values)) return null;
        const span = SPAN[field.width ?? "full"];
        if (field.type === "heading") {
          return field.label ? (
            <h3 key={field.name} className={cn("mt-3 border-b border-zinc-100 pb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 first:mt-0", span)}>
              {field.label}
            </h3>
          ) : (
            <div key={field.name} className={cn("hidden sm:block", span)} />
          );
        }
        const id = `${baseId}-${field.name}`;
        const inline = field.type === "boolean";
        return (
          <div key={field.name} className={cn(span, inline && "flex items-center justify-between gap-4 rounded-lg border border-zinc-200 px-3.5 py-2.5")}>
            <div className={cn(inline && "min-w-0")}>
              <label htmlFor={id} className={cn("a-label", inline && "!mb-0")}>
                {field.label}
                {field.required && <span className="ml-0.5 text-red-500">*</span>}
              </label>
              {inline && field.help && <p className="a-help !mt-0.5">{field.help}</p>}
            </div>
            <Control field={field} value={values[field.name]} refs={refs} id={id} onChange={(value) => onChange({ ...values, [field.name]: value })} />
            {!inline && field.help && field.type !== "markdown" && <p className="a-help">{field.help}</p>}
          </div>
        );
      })}
    </div>
  );
}
