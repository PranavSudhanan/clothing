"use client";

import { ArrowRight } from "lucide-react";
import { useState, useTransition, type FormEvent } from "react";
import { enquiryAction, subscribeAction } from "@/lib/actions/store";
import { cn } from "@/lib/utils";

export function Notice({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <p
      role="status"
      className={cn("border px-3.5 py-2.5 text-sm", ok ? "border-emerald-600/30 text-emerald-700" : "border-red-600/30 text-red-700")}
      style={{ borderRadius: "var(--radius)" }}
    >
      {children}
    </p>
  );
}

export function NewsletterForm({ buttonLabel = "Subscribe", compact = false }: { buttonLabel?: string; compact?: boolean }) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const email = String(new FormData(form).get("email") ?? "");
    start(async () => {
      const res = await subscribeAction(email);
      setResult(res);
      if (res.ok) form.reset();
    });
  }

  return (
    <form onSubmit={onSubmit} className="w-full">
      <div className={cn("flex w-full", compact ? "border-b border-current/30" : "flex-col gap-3 sm:flex-row")}>
        <input
          type="email"
          name="email"
          required
          placeholder="Your email address"
          aria-label="Email address"
          className={cn(
            compact
              ? "h-11 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-current placeholder:opacity-50"
              : "input flex-1",
          )}
        />
        {compact ? (
          <button type="submit" disabled={pending} aria-label={buttonLabel} className="px-2 transition-opacity hover:opacity-70">
            <ArrowRight size={18} strokeWidth={1.4} />
          </button>
        ) : (
          <button type="submit" disabled={pending} className="btn btn-primary">
            {pending ? "Joining…" : buttonLabel}
          </button>
        )}
      </div>
      {result && (
        <p role="status" className={cn("mt-3 text-sm", result.ok ? "opacity-80" : "text-red-500")}>
          {result.message}
        </p>
      )}
    </form>
  );
}

export function EnquiryForm() {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form)) as Record<string, string>;
    start(async () => {
      const res = await enquiryAction({
        name: data.name ?? "",
        email: data.email ?? "",
        phone: data.phone ?? "",
        subject: data.subject ?? "",
        message: data.message ?? "",
      });
      setResult(res);
      if (res.ok) form.reset();
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="enq-name">
            Name
          </label>
          <input id="enq-name" name="name" required className="input" autoComplete="name" />
        </div>
        <div>
          <label className="field-label" htmlFor="enq-email">
            Email
          </label>
          <input id="enq-email" name="email" type="email" required className="input" autoComplete="email" />
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="enq-phone">
            Phone <span className="normal-case tracking-normal opacity-70">(optional)</span>
          </label>
          <input id="enq-phone" name="phone" type="tel" className="input" autoComplete="tel" />
        </div>
        <div>
          <label className="field-label" htmlFor="enq-subject">
            Subject
          </label>
          <input id="enq-subject" name="subject" className="input" placeholder="Order, fitting, fabric…" />
        </div>
      </div>
      <div>
        <label className="field-label" htmlFor="enq-message">
          Message
        </label>
        <textarea id="enq-message" name="message" required rows={5} className="input" />
      </div>
      {result && <Notice ok={result.ok}>{result.message}</Notice>}
      <div>
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Sending…" : "Send message"}
        </button>
      </div>
    </form>
  );
}
