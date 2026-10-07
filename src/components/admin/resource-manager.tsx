"use client";

import { Check, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { deleteResourceAction, saveResourceAction } from "@/lib/actions/admin";
import { emptyValues, type FieldValues } from "@/lib/fields";
import { RESOURCES, type Column, type ResourceConfig } from "@/lib/resources";
import { formatDate, formatMoney } from "@/lib/utils";
import { FieldsForm, type Refs } from "./fields-form";
import { Drawer, EmptyRow, PageHeader, useToast } from "./ui";

type Row = FieldValues & { id: string };

function Cell({ column, row, currency, locale }: { column: Column; row: Row; currency: string; locale: string }) {
  const value = row[column.key];
  switch (column.type) {
    case "image":
      return value ? (
        <img src={String(value)} alt="" loading="lazy" className="h-11 w-11 rounded-lg border border-zinc-200 object-cover" />
      ) : (
        <span className="block h-11 w-11 rounded-lg border border-dashed border-zinc-200 bg-zinc-50" />
      );
    case "color":
      return <span className="block h-8 w-8 rounded-full border border-black/10" style={{ background: String(value ?? "#ccc") }} />;
    case "boolean":
      return value ? <Check size={16} className="text-emerald-600" /> : <X size={16} className="text-zinc-300" />;
    case "money":
      return <span className="tabular-nums">{formatMoney(Number(value ?? 0), currency, locale)}</span>;
    case "date":
      return <span className="text-zinc-500">{formatDate(value as Date | string)}</span>;
    case "count":
      return <span className="tabular-nums text-zinc-600">{String(value ?? 0)}</span>;
    default:
      return <span className="line-clamp-1">{String(value ?? "")}</span>;
  }
}

export function ResourceManager({
  resource,
  rows,
  refs,
  currency,
  locale,
}: {
  resource: ResourceConfig["key"];
  rows: Row[];
  refs?: Refs;
  currency: string;
  locale: string;
}) {
  const config = RESOURCES[resource];
  const router = useRouter();
  const toast = useToast();
  const [editing, setEditing] = useState<FieldValues | null>(null);
  const [query, setQuery] = useState("");
  const [pending, start] = useTransition();

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => config.columns.some((c) => String(row[c.key] ?? "").toLowerCase().includes(q)));
  }, [rows, query, config.columns]);

  const blank = () => ({ ...emptyValues(config.fields), ...structuredClone(config.defaults) });

  function save() {
    if (!editing) return;
    start(async () => {
      const result = await saveResourceAction(resource, editing);
      toast(result);
      if (result.ok) {
        setEditing(null);
        router.refresh();
      }
    });
  }

  function remove(row: Row) {
    const name = String(row[config.titleField] ?? `this ${config.singular}`);
    if (!window.confirm(`Delete “${name}”? This cannot be undone.`)) return;
    start(async () => {
      const result = await deleteResourceAction(resource, row.id);
      toast(result);
      if (result.ok) router.refresh();
    });
  }

  return (
    <>
      <PageHeader
        title={config.plural}
        description={config.description}
        actions={
          <button type="button" onClick={() => setEditing(blank())} className="a-btn a-btn-primary">
            <Plus size={15} /> Add {config.singular}
          </button>
        }
      />

      <div className="a-card overflow-hidden">
        {rows.length > 6 && (
          <div className="flex items-center gap-2 border-b border-zinc-100 px-4 py-2.5">
            <Search size={15} className="text-zinc-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${config.plural.toLowerCase()}…`}
              className="flex-1 bg-transparent py-1 text-sm outline-none"
            />
          </div>
        )}
        {shown.length === 0 ? (
          <EmptyRow>{rows.length === 0 ? `No ${config.plural.toLowerCase()} yet. Add your first one.` : "Nothing matches your search."}</EmptyRow>
        ) : (
          <div className="overflow-x-auto">
            <table className="a-table">
              <thead>
                <tr>
                  {config.columns.map((column) => (
                    <th key={column.key}>{column.label}</th>
                  ))}
                  <th className="w-24" />
                </tr>
              </thead>
              <tbody>
                {shown.map((row) => (
                  <tr key={row.id}>
                    {config.columns.map((column, i) => (
                      <td key={column.key} className={i === (config.columns[0].label ? 0 : 1) ? "font-medium" : undefined}>
                        <Cell column={column} row={row} currency={currency} locale={locale} />
                      </td>
                    ))}
                    <td>
                      <div className="flex justify-end gap-1">
                        <button type="button" aria-label="Edit" onClick={() => setEditing(structuredClone(row))} className="a-btn a-btn-ghost a-btn-icon">
                          <Pencil size={15} />
                        </button>
                        <button type="button" aria-label="Delete" disabled={pending} onClick={() => remove(row)} className="a-btn a-btn-ghost a-btn-icon text-red-600">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Drawer
        open={editing !== null}
        wide={resource === "services"}
        title={`${editing?.id ? "Edit" : "New"} ${config.singular}`}
        onClose={() => setEditing(null)}
        footer={
          <>
            <button type="button" onClick={() => setEditing(null)} className="a-btn">
              Cancel
            </button>
            <button type="button" disabled={pending} onClick={save} className="a-btn a-btn-primary">
              {pending ? "Saving…" : "Save"}
            </button>
          </>
        }
      >
        {editing && <FieldsForm fields={config.fields} values={editing} onChange={setEditing} refs={refs} />}
      </Drawer>
    </>
  );
}
