"use client";

import { Mail, MessageSquare } from "lucide-react";
import { useState } from "react";
import { cn, formatDate } from "@/lib/utils";
import { Badge, Card, EmptyRow, PageHeader } from "./ui";

type LogRow = {
  id: string;
  channel: "email" | "sms" | "whatsapp";
  event: string;
  recipient: string;
  subject: string;
  status: "sent" | "failed" | "skipped";
  error: string;
  reference: string;
  createdAt: Date;
};

type Preview = { key: string; label: string; when: string; subject: string; html: string };

const EVENT_LABELS: Record<string, string> = {
  order_placed: "Order confirmation",
  order_shipped: "Shipping update",
  order_delivered: "Delivered",
  order_cancelled: "Order cancelled",
  couture_received: "Couture request received",
  password_reset: "Password reset",
};

const TONE = { sent: "good", failed: "bad", skipped: "warn" } as const;

export function NotificationsView({
  log,
  previews,
  channels,
}: {
  log: LogRow[];
  previews: Preview[];
  channels: { email: boolean; sms: string | null; whatsapp: boolean; from: string };
}) {
  const [tab, setTab] = useState<"log" | "emails">("log");
  const [preview, setPreview] = useState(previews[0]?.key ?? "");
  const current = previews.find((p) => p.key === preview) ?? previews[0];

  const setup = [
    {
      ok: channels.email,
      label: "Email",
      text: channels.email ? `Sending from ${channels.from}` : "Not set up yet. Add SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS and EMAIL_FROM to your environment variables.",
    },
    {
      ok: Boolean(channels.sms),
      label: "SMS",
      text: channels.sms ? `Sending through ${channels.sms === "twilio" ? "Twilio" : "MSG91"}` : "Not set up yet. Add Twilio or MSG91 keys to text customers.",
    },
    {
      ok: channels.whatsapp,
      label: "WhatsApp",
      text: channels.whatsapp ? "Sending through Twilio" : "Optional. Add TWILIO_WHATSAPP_FROM to also message customers on WhatsApp.",
    },
  ];

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Emails and text messages sent to customers: order confirmations, shipping updates, couture confirmations and password resets."
      />

      <div className="mb-5 grid gap-3 md:grid-cols-3">
        {setup.map((item) => (
          <div key={item.label} className="a-card flex items-start gap-3 p-4">
            <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", item.ok ? "bg-emerald-500" : "bg-amber-500")} />
            <div className="min-w-0">
              <p className="text-[13.5px] font-medium">{item.label}</p>
              <p className="mt-0.5 break-words text-[13px] text-zinc-500">{item.text}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-5 flex gap-1">
        {(
          [
            ["log", `Sent messages (${log.length})`],
            ["emails", "Preview emails"],
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

      {tab === "log" && (
        <div className="a-card overflow-hidden">
          {log.length === 0 ? (
            <EmptyRow>Nothing has been sent yet. Messages appear here as soon as a customer places an order.</EmptyRow>
          ) : (
            <div className="overflow-x-auto">
              <table className="a-table">
                <thead>
                  <tr>
                    <th>When</th>
                    <th>Message</th>
                    <th>To</th>
                    <th>For</th>
                    <th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {log.map((row) => (
                    <tr key={row.id}>
                      <td className="whitespace-nowrap text-zinc-500">{formatDate(row.createdAt, true)}</td>
                      <td>
                        <span className="flex items-center gap-2 font-medium">
                          {row.channel === "email" ? <Mail size={14} className="text-zinc-400" /> : <MessageSquare size={14} className="text-zinc-400" />}
                          {EVENT_LABELS[row.event] ?? row.event}
                          {row.channel !== "email" && <span className="text-xs font-normal uppercase text-zinc-400">{row.channel}</span>}
                        </span>
                        <span className="mt-0.5 line-clamp-1 max-w-md text-xs text-zinc-500">{row.subject}</span>
                      </td>
                      <td className="text-zinc-600">{row.recipient}</td>
                      <td className="text-zinc-600">{row.reference || "—"}</td>
                      <td>
                        <Badge tone={TONE[row.status]}>{row.status === "skipped" ? "not sent" : row.status}</Badge>
                        {row.error && <span className="mt-1 block max-w-xs text-xs text-zinc-500">{row.error}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "emails" && current && (
        <div className="grid gap-5 lg:grid-cols-[16rem_minmax(0,1fr)]">
          <div className="space-y-1.5">
            {previews.map((item) => (
              <button
                key={item.key}
                onClick={() => setPreview(item.key)}
                className={cn(
                  "w-full rounded-xl border p-3 text-left transition",
                  item.key === current.key ? "border-zinc-900 bg-white" : "border-transparent hover:bg-white",
                )}
              >
                <span className="block text-[13.5px] font-medium">{item.label}</span>
                <span className="mt-0.5 block text-xs leading-snug text-zinc-500">{item.when}</span>
              </button>
            ))}
            <p className="px-3 pt-3 text-xs leading-relaxed text-zinc-500">
              Emails use your store name, logo, contact details and theme colours. The details shown here are samples.
            </p>
          </div>
          <Card title={current.subject} description="Subject line">
            <iframe
              title={`${current.label} email preview`}
              srcDoc={current.html}
              sandbox=""
              className="h-[42rem] w-full rounded-lg border border-zinc-200 bg-white"
            />
          </Card>
        </div>
      )}
    </>
  );
}
