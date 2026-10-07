"use client";

import { ArrowDown, ArrowUp, Image as ImageIcon, Images, LoaderCircle, Trash2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { listMediaAction } from "@/lib/actions/admin";
import { cn } from "@/lib/utils";
import { Modal, useToast } from "./ui";

const MAX_EDGE = 2400;

/** Shrinks large photos in the browser so uploads stay fast and under the server limit. */
async function prepare(file: File): Promise<Blob> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 900_000) return file;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.86));
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file;
  }
}

export async function uploadImage(file: File): Promise<{ ok: true; url: string } | { ok: false; message: string }> {
  const blob = await prepare(file);
  const extension = blob.type === "image/webp" ? "webp" : (file.name.split(".").pop() ?? "jpg");
  const name = `${file.name.replace(/\.[^.]+$/, "")}.${extension}`;
  const body = new FormData();
  body.append("file", blob, name);
  try {
    const response = await fetch("/api/upload", { method: "POST", body });
    const data = (await response.json().catch(() => null)) as { url?: string; message?: string } | null;
    if (!response.ok || !data?.url) return { ok: false, message: data?.message ?? "Upload failed. Please try again." };
    return { ok: true, url: data.url };
  } catch {
    return { ok: false, message: "Upload failed. Check your connection and try again." };
  }
}

function MediaGrid({ onPick }: { onPick: (url: string) => void }) {
  const [items, setItems] = useState<{ id: string; url: string; name: string }[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    listMediaAction()
      .then((rows) => !cancelled && setItems(rows))
      .catch(() => !cancelled && setItems([]));
    return () => {
      cancelled = true;
    };
  }, []);

  if (items === null) return <p className="py-10 text-center text-zinc-500">Loading…</p>;
  if (items.length === 0) {
    return <p className="py-10 text-center text-zinc-500">Nothing uploaded yet. Use the Upload button to add your first image.</p>;
  }
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          title={item.name}
          onClick={() => onPick(item.url)}
          className="aspect-square overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 transition hover:border-zinc-900 hover:shadow"
        >
          <img src={item.url} alt={item.name} loading="lazy" className="h-full w-full object-cover" />
        </button>
      ))}
    </div>
  );
}

function MediaPicker({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (url: string) => void }) {
  return (
    <Modal open={open} title="Media library" onClose={onClose}>
      <MediaGrid
        onPick={(picked) => {
          onPick(picked);
          onClose();
        }}
      />
    </Modal>
  );
}

export function ImageInput({ value, onChange, compact = false }: { value: string; onChange: (url: string) => void; compact?: boolean }) {
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [library, setLibrary] = useState(false);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    const result = await uploadImage(file);
    setBusy(false);
    if (result.ok) onChange(result.url);
    else toast(result);
  }

  return (
    <div className="flex items-start gap-3">
      <div className={cn("flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50", compact ? "h-[38px] w-[38px]" : "h-[76px] w-[76px]")}>
        {busy ? (
          <LoaderCircle size={18} className="animate-spin text-zinc-400" />
        ) : value ? (
          <img src={value} alt="" className="h-full w-full object-cover" />
        ) : (
          <ImageIcon size={18} className="text-zinc-300" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <input
          type="text"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste an image URL, or upload"
          className="a-input"
        />
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" disabled={busy} onClick={() => input.current?.click()} className="a-btn">
            <Upload size={14} /> {busy ? "Uploading…" : "Upload"}
          </button>
          <button type="button" onClick={() => setLibrary(true)} className="a-btn">
            <Images size={14} /> Library
          </button>
          {value && (
            <button type="button" onClick={() => onChange("")} className="a-btn a-btn-ghost text-zinc-500">
              Remove
            </button>
          )}
        </div>
        <input
          ref={input}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/avif,image/gif,image/svg+xml"
          hidden
          onChange={(e) => {
            void onFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>
      <MediaPicker open={library} onClose={() => setLibrary(false)} onPick={onChange} />
    </div>
  );
}

export function ImagesInput({ value, onChange }: { value: string[]; onChange: (urls: string[]) => void }) {
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [library, setLibrary] = useState(false);
  const [url, setUrl] = useState("");
  const list = Array.isArray(value) ? value : [];

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    const added: string[] = [];
    for (const file of Array.from(files).slice(0, 8)) {
      const result = await uploadImage(file);
      if (result.ok) added.push(result.url);
      else toast(result);
    }
    setBusy(false);
    if (added.length) onChange([...list, ...added]);
  }

  const move = (from: number, to: number) => {
    if (to < 0 || to >= list.length) return;
    const next = [...list];
    [next[from], next[to]] = [next[to], next[from]];
    onChange(next);
  };

  return (
    <div>
      {list.length > 0 && (
        <ul className="mb-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {list.map((src, i) => (
            <li key={src + i} className="group relative aspect-[3/4] overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
              <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
              {i === 0 && <span className="absolute left-1.5 top-1.5 rounded bg-zinc-900/80 px-1.5 py-0.5 text-[10px] font-medium text-white">Main</span>}
              <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1 bg-gradient-to-t from-black/60 to-transparent p-1.5 opacity-0 transition group-focus-within:opacity-100 group-hover:opacity-100">
                <button type="button" aria-label="Move earlier" onClick={() => move(i, i - 1)} className="rounded bg-white/90 p-1 hover:bg-white">
                  <ArrowUp size={13} className="-rotate-90" />
                </button>
                <button type="button" aria-label="Move later" onClick={() => move(i, i + 1)} className="rounded bg-white/90 p-1 hover:bg-white">
                  <ArrowDown size={13} className="-rotate-90" />
                </button>
                <button type="button" aria-label="Remove image" onClick={() => onChange(list.filter((_, idx) => idx !== i))} className="rounded bg-white/90 p-1 text-red-600 hover:bg-white">
                  <Trash2 size={13} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={busy} onClick={() => input.current?.click()} className="a-btn">
          {busy ? <LoaderCircle size={14} className="animate-spin" /> : <Upload size={14} />} {busy ? "Uploading…" : "Upload images"}
        </button>
        <button type="button" onClick={() => setLibrary(true)} className="a-btn">
          <Images size={14} /> Library
        </button>
        <div className="flex min-w-[14rem] flex-1 gap-2">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && url.trim()) {
                e.preventDefault();
                onChange([...list, url.trim()]);
                setUrl("");
              }
            }}
            placeholder="…or paste an image URL and press Enter"
            className="a-input"
          />
        </div>
      </div>
      <input
        ref={input}
        type="file"
        multiple
        accept="image/png,image/jpeg,image/webp,image/avif,image/gif"
        hidden
        onChange={(e) => {
          void onFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <MediaPicker open={library} onClose={() => setLibrary(false)} onPick={(picked) => onChange([...list, picked])} />
    </div>
  );
}
