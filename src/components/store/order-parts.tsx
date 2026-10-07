import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusPill } from "./ui";

export function orderTone(status: string): "neutral" | "good" | "warn" | "bad" {
  if (["delivered", "ready", "paid"].includes(status)) return "good";
  if (["cancelled", "returned", "refunded"].includes(status)) return "bad";
  if (["pending", "requested", "unpaid"].includes(status)) return "warn";
  return "neutral";
}

export function StatusBadge({ status, label }: { status: string; label: string }) {
  return <StatusPill tone={orderTone(status)}>{label}</StatusPill>;
}

/** A horizontal progress tracker. `steps` are in order; `current` is the active step's key. */
export function ProgressTracker({ steps, current }: { steps: { key: string; label: string }[]; current: string }) {
  const index = steps.findIndex((s) => s.key === current);
  return (
    <ol className="flex w-full overflow-x-auto pb-2">
      {steps.map((step, i) => {
        const done = i < index;
        const active = i === index;
        return (
          <li key={step.key} className="relative flex min-w-[5.5rem] flex-1 flex-col items-center text-center">
            {i > 0 && (
              <span className={cn("absolute right-1/2 top-3.5 h-px w-full", i <= index ? "bg-fg" : "bg-line")} aria-hidden />
            )}
            <span
              className={cn(
                "relative z-10 flex h-7 w-7 items-center justify-center rounded-full border text-xs",
                done && "border-fg bg-fg text-bg",
                active && "border-accent bg-accent text-accent-fg",
                !done && !active && "border-line bg-bg text-muted",
              )}
            >
              {done ? <Check size={14} strokeWidth={2} /> : i + 1}
            </span>
            <span className={cn("mt-2.5 px-1 text-[0.68rem] uppercase leading-tight tracking-[0.1em]", active || done ? "text-fg" : "text-muted")}>
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-line p-5 md:p-6" style={{ borderRadius: "var(--radius)" }}>
      <h2 className="!font-body mb-3 text-[0.72rem] !font-medium uppercase !tracking-[0.16em] text-muted">{title}</h2>
      <div className="text-sm leading-relaxed">{children}</div>
    </div>
  );
}
