"use client";

import { CircleAlert, CircleCheck, X } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ─── Toasts ───────────────────────────────────────────────────────────── */

type Toast = { id: number; ok: boolean; message: string };
const ToastContext = createContext<(result: { ok: boolean; message: string }) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const push = useCallback((result: { ok: boolean; message: string }) => {
    const id = ++counter.current;
    setToasts((current) => [...current.slice(-2), { id, ...result }]);
    window.setTimeout(() => setToasts((current) => current.filter((t) => t.id !== id)), result.ok ? 3200 : 6500);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[80] flex w-[min(92vw,24rem)] flex-col gap-2" aria-live="polite">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={cn(
              "animate-fade-up pointer-events-auto flex items-start gap-2.5 rounded-xl border bg-white px-4 py-3 text-[13.5px] shadow-lg shadow-black/10",
              toast.ok ? "border-emerald-200 text-emerald-900" : "border-red-200 text-red-900",
            )}
          >
            {toast.ok ? <CircleCheck size={18} className="mt-px shrink-0 text-emerald-600" /> : <CircleAlert size={18} className="mt-px shrink-0 text-red-600" />}
            <span className="flex-1">{toast.message}</span>
            <button type="button" aria-label="Dismiss" onClick={() => setToasts((c) => c.filter((t) => t.id !== toast.id))} className="opacity-50 hover:opacity-100">
              <X size={15} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/* ─── Layout pieces ────────────────────────────────────────────────────── */

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-[22px] font-semibold tracking-tight text-zinc-900">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-[13.5px] text-zinc-500">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, description, children, className, actions }: { title?: string; description?: string; children: ReactNode; className?: string; actions?: ReactNode }) {
  return (
    <section className={cn("a-card", className)}>
      {(title || actions) && (
        <header className="flex items-start justify-between gap-4 border-b border-zinc-100 px-5 py-4">
          <div>
            {title && <h2 className="text-[15px] font-semibold text-zinc-900">{title}</h2>}
            {description && <p className="mt-0.5 text-[13px] text-zinc-500">{description}</p>}
          </div>
          {actions}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

const BADGE_TONES = {
  neutral: "bg-zinc-100 text-zinc-700",
  good: "bg-emerald-50 text-emerald-700",
  warn: "bg-amber-50 text-amber-700",
  bad: "bg-red-50 text-red-700",
  info: "bg-sky-50 text-sky-700",
};

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: keyof typeof BADGE_TONES }) {
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize", BADGE_TONES[tone])}>{children}</span>;
}

export function Toggle({ checked, onChange, label, disabled }: { checked: boolean; onChange: (value: boolean) => void; label?: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn("relative h-[22px] w-10 shrink-0 rounded-full transition-colors disabled:opacity-50", checked ? "bg-zinc-900" : "bg-zinc-300")}
    >
      <span className={cn("absolute left-0.5 top-0.5 h-[18px] w-[18px] rounded-full bg-white shadow transition-transform", checked && "translate-x-[18px]")} />
    </button>
  );
}

/** Slide-over panel used for editing a record without leaving the list. */
export function Drawer({
  open,
  title,
  onClose,
  children,
  footer,
  wide = false,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" aria-label="Close" className="animate-fade-in absolute inset-0 bg-zinc-900/40" onClick={onClose} />
      <div className={cn("animate-slide-right absolute inset-y-0 right-0 flex w-full flex-col bg-white shadow-2xl", wide ? "max-w-3xl" : "max-w-xl")}>
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-200 px-5">
          <h2 className="text-[15px] font-semibold">{title}</h2>
          <button type="button" aria-label="Close" onClick={onClose} className="a-btn a-btn-ghost a-btn-icon">
            <X size={18} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {footer && <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-zinc-200 bg-zinc-50 px-5 py-3">{footer}</footer>}
      </div>
    </div>
  );
}

export function Modal({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" aria-label="Close" className="animate-fade-in absolute inset-0 bg-zinc-900/45" onClick={onClose} />
      <div className="animate-fade-up relative flex max-h-[86vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-200 px-5">
          <h2 className="text-[15px] font-semibold">{title}</h2>
          <button type="button" aria-label="Close" onClick={onClose} className="a-btn a-btn-ghost a-btn-icon">
            <X size={18} />
          </button>
        </header>
        <div className="overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

export function EmptyRow({ children }: { children: ReactNode }) {
  return <div className="px-5 py-14 text-center text-[13.5px] text-zinc-500">{children}</div>;
}
