"use client";

import { Check, Home, Package, Ruler, Store } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { getProfileAction, submitCoutureAction, type Profile } from "@/lib/actions/store";
import { MEASUREMENT_FIELDS, type MeasurementMethod, type StyleOption } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Notice } from "./forms";
import { markPlaced } from "./placed-popup";
import { useMoney } from "./providers";

type FabricOption = { id: string; name: string; material: string; hex: string; image: string; priceDelta: number };

type Props = {
  service: {
    id: string;
    name: string;
    basePrice: number;
    leadTimeDays: number;
    measurementFields: string[];
    styleOptions: StyleOption[];
  };
  fabrics: FabricOption[];
};

const STEPS = ["Fabric", "Style", "Measurements", "Your details"];
const SLOTS = ["11am – 1pm", "1pm – 3pm", "3pm – 5pm", "5pm – 7pm"];
const METHODS: { key: MeasurementMethod; label: string; text: string; icon: typeof Ruler }[] = [
  { key: "self", label: "Enter measurements", text: "Use our guide and a measuring tape", icon: Ruler },
  { key: "store", label: "Visit the studio", text: "Be measured by our cutter", icon: Store },
  { key: "home", label: "Home visit", text: "A tailor comes to you", icon: Home },
  { key: "garment", label: "Send a garment", text: "We copy the fit of one you love", icon: Package },
];

function tomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export function CoutureConfigurator({ service, fabrics }: Props) {
  const router = useRouter();
  const money = useMoney();
  const [step, setStep] = useState(0);
  const [fabricId, setFabricId] = useState<string | null>(fabrics[0]?.id ?? null);
  const [styles, setStyles] = useState<Record<string, string>>(() =>
    Object.fromEntries(service.styleOptions.map((o) => [o.name, o.choices[0]?.label ?? ""])),
  );
  const [method, setMethod] = useState<MeasurementMethod>("self");
  const [unit, setUnit] = useState<"in" | "cm">("in");
  const [measurements, setMeasurements] = useState<Record<string, string>>({});
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState(SLOTS[0]);
  const [address, setAddress] = useState("");
  const [contact, setContact] = useState({ name: "", email: "", phone: "", notes: "" });
  const [saveProfile, setSaveProfile] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  useEffect(() => {
    let cancelled = false;
    getProfileAction().then((p) => {
      if (cancelled || !p) return;
      setProfile(p);
      setContact((c) => ({ ...c, name: c.name || p.name, email: c.email || p.email, phone: c.phone || p.phone }));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const fabric = fabrics.find((f) => f.id === fabricId) ?? null;
  const estimate = useMemo(() => {
    let total = service.basePrice + (fabric?.priceDelta ?? 0);
    for (const option of service.styleOptions) {
      total += option.choices.find((c) => c.label === styles[option.name])?.priceDelta ?? 0;
    }
    return Math.max(total, 0);
  }, [service, fabric, styles]);

  function validate(current: number) {
    if (current === 2) {
      if (method === "self") {
        const missing = service.measurementFields.filter((f) => !(Number(measurements[f]) > 0));
        if (missing.length > 0) return `Please enter: ${missing.map((f) => MEASUREMENT_FIELDS[f]?.label ?? f).join(", ")}.`;
      }
      if ((method === "store" || method === "home") && !date) return "Choose a preferred date for your fitting.";
      if ((method === "store" || method === "home") && date < tomorrow()) return "Choose a date from tomorrow onwards.";
      if ((method === "home" || method === "garment") && address.trim().length < 8) return "Enter the full address.";
    }
    if (current === 3) {
      if (contact.name.trim().length < 2) return "Enter your name.";
      if (!/^\S+@\S+\.\S+$/.test(contact.email)) return "Enter a valid email address.";
      if (contact.phone.replace(/\D/g, "").length < 7) return "Enter a valid phone number.";
    }
    return "";
  }

  function next() {
    const problem = validate(step);
    setError(problem);
    if (problem) return;
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      document.getElementById("configure")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    start(async () => {
      const result = await submitCoutureAction({
        serviceId: service.id,
        fabricId,
        styles,
        method,
        unit,
        measurements: Object.fromEntries(
          Object.entries(measurements)
            .map(([k, v]) => [k, Number(v)] as const)
            .filter(([, v]) => v > 0),
        ),
        appointmentDate: method === "store" || method === "home" ? date : "",
        appointmentSlot: method === "store" || method === "home" ? slot : "",
        address: method === "home" || method === "garment" ? address : "",
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        notes: contact.notes,
        saveProfile: Boolean(profile) && saveProfile,
      });
      if (result.ok) {
        markPlaced(result.token);
        router.push(`/couture/request/${result.token}`);
      } else {
        setError(result.message);
      }
    });
  }

  const chip = (active: boolean) =>
    cn("border px-4 py-3 text-left text-sm transition-colors", active ? "border-fg bg-fg text-bg" : "border-line hover:border-fg");

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-14">
      <div>
        {/* Step indicator */}
        <ol className="mb-10 grid grid-cols-4 gap-2">
          {STEPS.map((label, i) => (
            <li key={label}>
              <button
                type="button"
                disabled={i > step}
                onClick={() => {
                  setError("");
                  setStep(i);
                }}
                className="w-full text-left disabled:cursor-default"
              >
                <span className={cn("block h-0.5 w-full transition-colors", i <= step ? "bg-accent" : "bg-line")} />
                <span className={cn("mt-3 block text-[0.66rem] uppercase tracking-[0.14em]", i <= step ? "text-fg" : "text-muted")}>
                  <span className="mr-1.5 text-accent">{String(i + 1).padStart(2, "0")}</span>
                  <span className={cn(i !== step && "hidden sm:inline")}>{label}</span>
                </span>
              </button>
            </li>
          ))}
        </ol>

        {step === 0 && (
          <div className="animate-fade-in">
            <h3 className="text-3xl">Choose your cloth</h3>
            <p className="mt-2 text-muted">Every fabric is cut fresh for your order.</p>
            <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {fabrics.map((option) => {
                const active = option.id === fabricId;
                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setFabricId(option.id)}
                    className={cn("group relative border p-2.5 text-left transition-colors", active ? "border-fg" : "border-line hover:border-fg")}
                    style={{ borderRadius: "var(--radius)" }}
                  >
                    <span
                      className="relative block overflow-hidden"
                      style={{ aspectRatio: "4 / 3", background: option.hex, borderRadius: "var(--radius)" }}
                    >
                      {option.image ? (
                        <img src={option.image} alt="" className="h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <span
                          aria-hidden
                          className="absolute inset-0 opacity-40 mix-blend-overlay"
                          style={{
                            backgroundImage:
                              "repeating-linear-gradient(45deg, rgb(255 255 255 / 0.5) 0 1px, transparent 1px 4px), repeating-linear-gradient(-45deg, rgb(0 0 0 / 0.4) 0 1px, transparent 1px 4px)",
                          }}
                        />
                      )}
                      {active && (
                        <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white text-black">
                          <Check size={14} strokeWidth={2} />
                        </span>
                      )}
                    </span>
                    <span className="mt-2.5 block text-sm font-medium leading-snug">{option.name}</span>
                    <span className="block text-xs text-muted">{option.material}</span>
                    <span className="mt-1 block text-xs">{option.priceDelta > 0 ? `+ ${money(option.priceDelta)}` : "Included"}</span>
                  </button>
                );
              })}
              <button
                type="button"
                aria-pressed={fabricId === null}
                onClick={() => setFabricId(null)}
                className={cn(
                  "flex min-h-32 flex-col justify-center border border-dashed p-4 text-left transition-colors",
                  fabricId === null ? "border-fg" : "border-line hover:border-fg",
                )}
                style={{ borderRadius: "var(--radius)" }}
              >
                <span className="text-sm font-medium">Decide at the fitting</span>
                <span className="mt-1 text-xs text-muted">See swatches in person, or bring your own cloth.</span>
              </button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="animate-fade-in space-y-9">
            <div>
              <h3 className="text-3xl">Make it yours</h3>
              <p className="mt-2 text-muted">Not sure? Leave the defaults — we will talk them through at your fitting.</p>
            </div>
            {service.styleOptions.length === 0 && <p className="text-muted">This garment has no style options to choose.</p>}
            {service.styleOptions.map((option) => (
              <fieldset key={option.name}>
                <legend className="mb-3 text-[0.72rem] font-medium uppercase tracking-[0.16em]">{option.name}</legend>
                <div className="flex flex-wrap gap-2.5">
                  {option.choices.map((choice) => {
                    const active = styles[option.name] === choice.label;
                    return (
                      <button
                        key={choice.label}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setStyles((s) => ({ ...s, [option.name]: choice.label }))}
                        className={chip(active)}
                        style={{ borderRadius: "var(--radius)" }}
                      >
                        {choice.label}
                        {choice.priceDelta !== 0 && (
                          <span className={cn("ml-2 text-xs", active ? "opacity-80" : "text-muted")}>
                            {choice.priceDelta > 0 ? "+" : "−"} {money(Math.abs(choice.priceDelta))}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in">
            <h3 className="text-3xl">How shall we measure you?</h3>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {METHODS.map((option) => {
                const active = method === option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      setMethod(option.key);
                      setError("");
                    }}
                    className={cn("flex items-center gap-4 border p-4 text-left transition-colors", active ? "border-fg" : "border-line hover:border-fg")}
                    style={{ borderRadius: "var(--radius)" }}
                  >
                    <option.icon size={24} strokeWidth={1.2} className={cn("shrink-0", active ? "text-accent" : "text-muted")} />
                    <span>
                      <span className="block text-sm font-medium">{option.label}</span>
                      <span className="text-xs text-muted">{option.text}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            {method === "self" && (
              <div className="mt-9">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="inline-flex border border-line" style={{ borderRadius: "var(--radius)" }}>
                    {(["in", "cm"] as const).map((u) => (
                      <button
                        key={u}
                        type="button"
                        aria-pressed={unit === u}
                        onClick={() => setUnit(u)}
                        className={cn("px-4 py-2 text-xs uppercase tracking-[0.14em] transition-colors", unit === u && "bg-fg text-bg")}
                      >
                        {u === "in" ? "Inches" : "Centimetres"}
                      </button>
                    ))}
                  </div>
                  {profile && profile.measurements.length > 0 && (
                    <select
                      aria-label="Load a saved measurement profile"
                      defaultValue=""
                      onChange={(e) => {
                        const saved = profile.measurements.find((m) => m.id === e.target.value);
                        if (!saved) return;
                        setUnit(saved.unit);
                        setMeasurements(Object.fromEntries(Object.entries(saved.values).map(([k, v]) => [k, String(v)])));
                      }}
                      className="input !min-h-10 !w-auto !py-1.5 text-sm"
                    >
                      <option value="">Load saved measurements…</option>
                      {profile.measurements.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div className="mt-6 grid gap-x-5 gap-y-5 sm:grid-cols-2">
                  {service.measurementFields.map((field) => {
                    const meta = MEASUREMENT_FIELDS[field] ?? { label: field, hint: "" };
                    return (
                      <div key={field}>
                        <label className="field-label" htmlFor={`m-${field}`}>
                          {meta.label} <span className="normal-case tracking-normal opacity-70">({unit})</span>
                        </label>
                        <input
                          id={`m-${field}`}
                          type="number"
                          inputMode="decimal"
                          min="0"
                          step="0.25"
                          value={measurements[field] ?? ""}
                          onChange={(e) => setMeasurements((m) => ({ ...m, [field]: e.target.value }))}
                          className="input"
                        />
                        {meta.hint && <p className="mt-1.5 text-xs text-muted">{meta.hint}</p>}
                      </div>
                    );
                  })}
                </div>
                {profile && (
                  <label className="mt-6 flex cursor-pointer items-center gap-3 text-sm">
                    <input type="checkbox" checked={saveProfile} onChange={(e) => setSaveProfile(e.target.checked)} className="h-4 w-4 accent-current" />
                    Save these measurements to my account for next time
                  </label>
                )}
              </div>
            )}

            {(method === "store" || method === "home") && (
              <div className="mt-9 grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="field-label" htmlFor="c-date">
                    Preferred date
                  </label>
                  <input
                    id="c-date"
                    type="date"
                    value={date}
                    onFocus={(e) => {
                      e.currentTarget.min = tomorrow();
                    }}
                    onChange={(e) => setDate(e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="c-slot">
                    Preferred time
                  </label>
                  <select id="c-slot" value={slot} onChange={(e) => setSlot(e.target.value)} className="input">
                    {SLOTS.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <p className="text-sm text-muted sm:col-span-2">We will call to confirm the exact time.</p>
              </div>
            )}

            {(method === "home" || method === "garment") && (
              <div className="mt-6">
                <label className="field-label" htmlFor="c-address">
                  {method === "home" ? "Address for the visit" : "Pickup address for your garment"}
                </label>
                <textarea id="c-address" rows={3} value={address} onChange={(e) => setAddress(e.target.value)} className="input" />
                {method === "garment" && (
                  <p className="mt-2 text-sm text-muted">We will collect a garment that fits you well, copy its measurements and return it with your order.</p>
                )}
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="animate-fade-in">
            <h3 className="text-3xl">Where shall we reach you?</h3>
            <p className="mt-2 text-muted">No payment now. We confirm the details and final price with you first.</p>
            <div className="mt-7 grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="field-label" htmlFor="c-name">
                  Full name
                </label>
                <input id="c-name" autoComplete="name" value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} className="input" />
              </div>
              <div>
                <label className="field-label" htmlFor="c-email">
                  Email
                </label>
                <input id="c-email" type="email" autoComplete="email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} className="input" />
              </div>
              <div>
                <label className="field-label" htmlFor="c-phone">
                  Phone
                </label>
                <input id="c-phone" type="tel" autoComplete="tel" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} className="input" />
              </div>
              <div className="sm:col-span-2">
                <label className="field-label" htmlFor="c-notes">
                  Anything we should know? <span className="normal-case tracking-normal opacity-70">(optional)</span>
                </label>
                <textarea
                  id="c-notes"
                  rows={4}
                  maxLength={2000}
                  value={contact.notes}
                  onChange={(e) => setContact({ ...contact, notes: e.target.value })}
                  placeholder="The occasion, your deadline, a reference you like, own fabric…"
                  className="input"
                />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-7">
            <Notice ok={false}>{error}</Notice>
          </div>
        )}

        <div className="mt-10 flex items-center justify-between gap-4 border-t border-line pt-6">
          <button
            type="button"
            disabled={step === 0}
            onClick={() => {
              setError("");
              setStep(step - 1);
            }}
            className="link-underline disabled:invisible"
          >
            Back
          </button>
          <button type="button" disabled={pending} onClick={next} className="btn btn-primary">
            {step < STEPS.length - 1 ? `Continue to ${STEPS[step + 1].toLowerCase()}` : pending ? "Sending…" : "Send my request"}
          </button>
        </div>
      </div>

      <aside className="h-fit border border-line p-6 lg:sticky lg:top-28" style={{ borderRadius: "var(--radius)" }}>
        <p className="eyebrow">Your {service.name.toLowerCase()}</p>
        <dl className="mt-5 space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Fabric</dt>
            <dd className="text-right">{fabric?.name ?? "Decide at the fitting"}</dd>
          </div>
          {service.styleOptions.map((option) => (
            <div key={option.name} className="flex justify-between gap-4">
              <dt className="text-muted">{option.name}</dt>
              <dd className="text-right">{styles[option.name]}</dd>
            </div>
          ))}
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Ready in</dt>
            <dd className="text-right">about {service.leadTimeDays} days</dd>
          </div>
        </dl>
        <div className="mt-6 border-t border-line pt-5">
          <p className="text-xs uppercase tracking-[0.14em] text-muted">Estimated price</p>
          <p className="heading mt-1 text-4xl tabular-nums">{money(estimate)}</p>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            Includes a trial fitting and 30 days of alterations. The final price is confirmed before any payment.
          </p>
        </div>
      </aside>
    </div>
  );
}
