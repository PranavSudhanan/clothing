"use client";

import { Copy, Download, Mail, Trash2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { deleteEnquiryAction, deleteMediaAction, deleteSubscriberAction, setEnquiryStatusAction } from "@/lib/actions/admin";
import { cn, formatDate, statusTone } from "@/lib/utils";
import { uploadImage } from "./image-input";
import { Badge, EmptyRow, PageHeader, useToast } from "./ui";

/* ─── Media library ────────────────────────────────────────────────────── */

type MediaItem = { id: string; url: string; name: string; size: number };

export function MediaLibrary({ items }: { items: MediaItem[] }) {
  const router = useRouter();
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [pending, start] = useTransition();

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    let uploaded = 0;
    for (const file of Array.from(files).slice(0, 12)) {
      const result = await uploadImage(file);
      if (result.ok) uploaded += 1;
      else toast(result);
    }
    setBusy(false);
    if (uploaded) {
      toast({ ok: true, message: `${uploaded} ${uploaded === 1 ? "image" : "images"} uploaded.` });
      router.refresh();
    }
  }

  async function copy(url: string) {
    const absolute = url.startsWith("/") ? `${window.location.origin}${url}` : url;
    try {
      await navigator.clipboard.writeText(absolute);
      toast({ ok: true, message: "Link copied." });
    } catch {
      toast({ ok: false, message: "Could not copy. Select the link manually instead." });
    }
  }

  function remove(item: MediaItem) {
    if (!window.confirm(`Delete “${item.name || "this image"}”? Anything still using it will show a missing image.`)) return;
    start(async () => {
      const result = await deleteMediaAction(item.id);
      toast(result);
      if (result.ok) router.refresh();
    });
  }

  return (
    <>
      <PageHeader
        title="Media"
        description="Every image you have uploaded. Pick from this library in any image field."
        actions={
          <button type="button" disabled={busy} onClick={() => input.current?.click()} className="a-btn a-btn-primary">
            <Upload size={15} /> {busy ? "Uploading…" : "Upload images"}
          </button>
        }
      />
      <input
        ref={input}
        type="file"
        multiple
        hidden
        accept="image/png,image/jpeg,image/webp,image/avif,image/gif,image/svg+xml"
        onChange={(e) => {
          void onFiles(e.target.files);
          e.target.value = "";
        }}
      />
      {items.length === 0 ? (
        <div className="a-card">
          <EmptyRow>No uploads yet. Images are resized in your browser before upload, so large photos are fine.</EmptyRow>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {items.map((item) => (
            <li key={item.id} className="a-card group overflow-hidden">
              <div className="aspect-square bg-zinc-50">
                <img src={item.url} alt={item.name} loading="lazy" className="h-full w-full object-cover" />
              </div>
              <div className="flex items-center gap-1 px-2 py-1.5">
                <span className="min-w-0 flex-1 truncate text-xs text-zinc-600" title={item.name}>
                  {item.name || "image"}
                  <span className="block text-[11px] text-zinc-400">{Math.max(1, Math.round(item.size / 1024))} KB</span>
                </span>
                <button type="button" aria-label="Copy link" title="Copy link" onClick={() => copy(item.url)} className="a-btn a-btn-ghost a-btn-icon !min-h-7 !w-7">
                  <Copy size={13} />
                </button>
                <button type="button" aria-label="Delete" title="Delete" disabled={pending} onClick={() => remove(item)} className="a-btn a-btn-ghost a-btn-icon !min-h-7 !w-7 text-red-600">
                  <Trash2 size={13} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

/* ─── Inbox ────────────────────────────────────────────────────────────── */

type Message = { id: string; name: string; email: string; phone: string; subject: string; message: string; status: "new" | "read" | "closed"; createdAt: Date };
type Subscriber = { id: string; email: string; createdAt: Date };

export function InboxView({ messages, subscribers }: { messages: Message[]; subscribers: Subscriber[] }) {
  const router = useRouter();
  const toast = useToast();
  const [tab, setTab] = useState<"messages" | "subscribers">("messages");
  const [open, setOpen] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const unread = messages.filter((m) => m.status === "new").length;

  const run = (task: () => Promise<{ ok: boolean; message: string }>, quiet = false) =>
    start(async () => {
      const result = await task();
      if (!quiet || !result.ok) toast(result);
      if (result.ok) router.refresh();
    });

  function exportCsv() {
    const rows = [["email", "subscribed_at"], ...subscribers.map((s) => [s.email, new Date(s.createdAt).toISOString()])];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    link.download = "subscribers.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  return (
    <>
      <PageHeader
        title="Inbox"
        description="Messages from your contact form and people who joined the newsletter."
        actions={
          tab === "subscribers" && subscribers.length > 0 ? (
            <button type="button" onClick={exportCsv} className="a-btn">
              <Download size={15} /> Export CSV
            </button>
          ) : undefined
        }
      />
      <div className="mb-5 flex gap-1">
        {(
          [
            ["messages", `Messages${unread ? ` (${unread} new)` : ""}`],
            ["subscribers", `Subscribers (${subscribers.length})`],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn("rounded-lg px-3 py-1.5 text-[13.5px] font-medium transition-colors", tab === key ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-200/70")}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "messages" && (
        <div className="a-card overflow-hidden">
          {messages.length === 0 ? (
            <EmptyRow>No messages yet. Enquiries from the contact form land here.</EmptyRow>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {messages.map((message) => {
                const expanded = open === message.id;
                return (
                  <li key={message.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(expanded ? null : message.id);
                        if (!expanded && message.status === "new") run(() => setEnquiryStatusAction(message.id, "read"), true);
                      }}
                      className="flex w-full items-center gap-3 px-5 py-3.5 text-left hover:bg-zinc-50"
                    >
                      <span className={cn("h-2 w-2 shrink-0 rounded-full", message.status === "new" ? "bg-sky-500" : "bg-transparent")} />
                      <span className="min-w-0 flex-1">
                        <span className={cn("block truncate", message.status === "new" && "font-semibold")}>
                          {message.name} <span className="font-normal text-zinc-500">· {message.subject || "No subject"}</span>
                        </span>
                        {!expanded && <span className="block truncate text-[13px] text-zinc-500">{message.message}</span>}
                      </span>
                      <Badge tone={statusTone(message.status)}>{message.status}</Badge>
                      <span className="hidden shrink-0 text-xs text-zinc-400 sm:block">{formatDate(message.createdAt)}</span>
                    </button>
                    {expanded && (
                      <div className="border-t border-zinc-100 bg-zinc-50/60 px-5 py-4 pl-10">
                        <p className="whitespace-pre-wrap text-zinc-800">{message.message}</p>
                        <p className="mt-3 text-[13px] text-zinc-500">
                          {message.email}
                          {message.phone && ` · ${message.phone}`} · {formatDate(message.createdAt, true)}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <a href={`mailto:${message.email}?subject=${encodeURIComponent(`Re: ${message.subject || "your enquiry"}`)}`} className="a-btn a-btn-primary">
                            <Mail size={14} /> Reply by email
                          </a>
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => run(() => setEnquiryStatusAction(message.id, message.status === "closed" ? "read" : "closed"))}
                            className="a-btn"
                          >
                            {message.status === "closed" ? "Reopen" : "Mark as closed"}
                          </button>
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => {
                              if (window.confirm("Delete this message?")) run(() => deleteEnquiryAction(message.id));
                            }}
                            className="a-btn a-btn-danger"
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {tab === "subscribers" && (
        <div className="a-card overflow-hidden">
          {subscribers.length === 0 ? (
            <EmptyRow>No subscribers yet. Add a newsletter section to a page to start collecting emails.</EmptyRow>
          ) : (
            <table className="a-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Joined</th>
                  <th className="w-14" />
                </tr>
              </thead>
              <tbody>
                {subscribers.map((subscriber) => (
                  <tr key={subscriber.id}>
                    <td className="font-medium">{subscriber.email}</td>
                    <td className="text-zinc-500">{formatDate(subscriber.createdAt)}</td>
                    <td>
                      <button
                        type="button"
                        aria-label="Remove subscriber"
                        disabled={pending}
                        onClick={() => {
                          if (window.confirm(`Remove ${subscriber.email} from the list?`)) run(() => deleteSubscriberAction(subscriber.id));
                        }}
                        className="a-btn a-btn-ghost a-btn-icon text-red-600"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </>
  );
}
