"use client";

import { Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useState, useTransition, type FormEvent } from "react";
import {
  changePasswordAction,
  loginAction,
  logoutAction,
  registerAction,
  requestPasswordResetAction,
  resetPasswordAction,
  saveAddressesAction,
  saveMeasurementsAction,
  trackAction,
  updateProfileAction,
  type ActionResult,
} from "@/lib/actions/store";
import {
  COUTURE_STATUS_LABELS,
  MEASUREMENT_FIELDS,
  ORDER_STATUS_LABELS,
  type Address,
  type CoutureStatus,
  type MeasurementProfile,
  type OrderStatus,
} from "@/lib/types";
import { cn, uid } from "@/lib/utils";
import { Notice } from "./forms";
import { LocationFields, type GeoOption } from "./location-fields";
import { StatusBadge } from "./order-parts";
import { useMoney } from "./providers";
import { Picture } from "./ui";

/* ─── Track order ──────────────────────────────────────────────────────── */

export function TrackForm() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState("");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setError("");
    start(async () => {
      const result = await trackAction(String(data.get("number") ?? ""), String(data.get("email") ?? ""));
      if (result.ok) router.push(result.href);
      else setError(result.message);
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5 text-left">
      <div>
        <label className="field-label" htmlFor="track-number">
          Order number
        </label>
        <input id="track-number" name="number" required placeholder="AT-261007-12345" className="input uppercase" />
      </div>
      <div>
        <label className="field-label" htmlFor="track-email">
          Email
        </label>
        <input id="track-email" name="email" type="email" required autoComplete="email" className="input" />
      </div>
      {error && <Notice ok={false}>{error}</Notice>}
      <button type="submit" disabled={pending} className="btn btn-primary btn-block">
        {pending ? "Looking…" : "Find my order"}
      </button>
    </form>
  );
}

/* ─── Sign in / register ───────────────────────────────────────────────── */

export function AuthForm({ mode, next, notice }: { mode: "login" | "register"; next: string; notice?: string }) {
  const [state, action, pending] = useActionState(mode === "login" ? loginAction : registerAction, null);

  return (
    <form action={action} className="grid gap-5">
      <input type="hidden" name="next" value={next} />
      {notice && !state?.message && <Notice ok>{notice}</Notice>}
      {mode === "register" && (
        <div>
          <label className="field-label" htmlFor="auth-name">
            Full name
          </label>
          <input id="auth-name" name="name" required autoComplete="name" defaultValue={state?.values?.name ?? ""} className="input" />
        </div>
      )}
      <div>
        <label className="field-label" htmlFor="auth-email">
          Email
        </label>
        <input id="auth-email" name="email" type="email" required autoComplete="email" defaultValue={state?.values?.email ?? ""} className="input" />
      </div>
      {mode === "register" && (
        <div>
          <label className="field-label" htmlFor="auth-phone">
            Phone <span className="normal-case tracking-normal opacity-70">(optional)</span>
          </label>
          <input id="auth-phone" name="phone" type="tel" autoComplete="tel" defaultValue={state?.values?.phone ?? ""} className="input" />
        </div>
      )}
      <div>
        <label className="field-label" htmlFor="auth-password">
          Password
        </label>
        <input
          id="auth-password"
          name="password"
          type="password"
          required
          minLength={mode === "register" ? 8 : undefined}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          className="input"
        />
        {mode === "register" && <p className="mt-1.5 text-xs text-muted">At least 8 characters.</p>}
        {mode === "login" && (
          <p className="mt-2 text-right text-xs">
            <Link href="/forgot-password" className="text-muted underline underline-offset-4 hover:text-fg">
              Forgot password?
            </Link>
          </p>
        )}
      </div>
      {state?.message && <Notice ok={false}>{state.message}</Notice>}
      <button type="submit" disabled={pending} className="btn btn-primary btn-block">
        {pending ? "One moment…" : mode === "login" ? "Sign in" : "Create account"}
      </button>
      <p className="text-center text-sm text-muted">
        {mode === "login" ? "New here? " : "Already have an account? "}
        <Link
          href={`${mode === "login" ? "/register" : "/login"}${next !== "/account" ? `?next=${encodeURIComponent(next)}` : ""}`}
          className="text-fg underline underline-offset-4"
        >
          {mode === "login" ? "Create an account" : "Sign in"}
        </Link>
      </p>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordResetAction, null);

  if (state?.ok) {
    return (
      <div className="grid gap-5 text-center">
        <Notice ok>{state.message}</Notice>
        <p className="text-sm text-muted">Nothing in your inbox after a few minutes? Check the spam folder, or try again.</p>
        <Link href="/login" className="btn btn-outline btn-block">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="grid gap-5">
      <div>
        <label className="field-label" htmlFor="forgot-email">
          Email
        </label>
        <input
          id="forgot-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          defaultValue={state?.values?.email ?? ""}
          className="input"
        />
      </div>
      {state?.message && <Notice ok={false}>{state.message}</Notice>}
      <button type="submit" disabled={pending} className="btn btn-primary btn-block">
        {pending ? "Sending…" : "Email me a reset link"}
      </button>
      <p className="text-center text-sm text-muted">
        Remembered it?{" "}
        <Link href="/login" className="text-fg underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPasswordAction, null);

  return (
    <form action={action} className="grid gap-5">
      <input type="hidden" name="token" value={token} />
      <div>
        <label className="field-label" htmlFor="reset-password">
          New password
        </label>
        <input id="reset-password" name="password" type="password" required minLength={8} autoComplete="new-password" className="input" />
        <p className="mt-1.5 text-xs text-muted">At least 8 characters.</p>
      </div>
      <div>
        <label className="field-label" htmlFor="reset-confirm">
          Repeat the new password
        </label>
        <input id="reset-confirm" name="confirm" type="password" required minLength={8} autoComplete="new-password" className="input" />
      </div>
      {state?.message && (
        <Notice ok={false}>
          {state.message}
          {state.values?.expired && (
            <>
              {" "}
              <Link href="/forgot-password" className="underline underline-offset-4">
                Request a new link
              </Link>
            </>
          )}
        </Notice>
      )}
      <button type="submit" disabled={pending} className="btn btn-primary btn-block">
        {pending ? "Saving…" : "Save new password"}
      </button>
    </form>
  );
}

/* ─── Account dashboard ────────────────────────────────────────────────── */

export type AccountData = {
  user: { name: string; email: string; phone: string; addresses: Address[]; measurements: MeasurementProfile[] };
  orders: { number: string; token: string; date: string; status: string; total: number; items: number; image: string }[];
  couture: { number: string; token: string; date: string; status: string; service: string; price: number }[];
  /** Countries the store delivers to, for the address dropdowns. */
  countries: GeoOption[];
};

const TABS = ["Orders", "Couture", "Addresses", "Measurements", "Profile"] as const;
const EMPTY_ADDRESS: Address = { name: "", phone: "", line1: "", line2: "", city: "", state: "", postalCode: "", country: "" };

function useSaver() {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  const run = (task: () => Promise<ActionResult>) =>
    start(async () => {
      setResult(null);
      setResult(await task());
    });
  return { pending, result, run };
}

function AddressesTab({ initial, countries }: { initial: Address[]; countries: GeoOption[] }) {
  const [list, setList] = useState<Address[]>(initial);
  const { pending, result, run } = useSaver();
  const update = (i: number, key: keyof Address, value: string) =>
    setList((current) => current.map((a, idx) => (idx === i ? { ...a, [key]: value } : a)));

  const fields: { key: keyof Address; label: string; wide?: boolean }[] = [
    { key: "name", label: "Full name" },
    { key: "phone", label: "Phone" },
    { key: "line1", label: "Address", wide: true },
    { key: "line2", label: "Area / landmark", wide: true },
  ];
  const blank: Address = { ...EMPTY_ADDRESS, country: countries[0]?.name ?? "", countryCode: countries[0]?.code };

  return (
    <div className="space-y-6">
      {list.length === 0 && <p className="text-muted">No saved addresses yet. Add one to check out faster.</p>}
      {list.map((address, i) => (
        <div key={i} className="border border-line p-5 md:p-6" style={{ borderRadius: "var(--radius)" }}>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-[0.72rem] font-medium uppercase tracking-[0.16em]">Address {i + 1}</p>
            <button
              type="button"
              aria-label="Remove address"
              onClick={() => setList((current) => current.filter((_, idx) => idx !== i))}
              className="p-1 text-muted hover:text-red-600"
            >
              <Trash2 size={16} strokeWidth={1.5} />
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((field) => (
              <div key={field.key} className={cn(field.wide && "sm:col-span-2")}>
                <label className="field-label">{field.label}</label>
                <input value={address[field.key] ?? ""} onChange={(e) => update(i, field.key, e.target.value)} className="input" />
              </div>
            ))}
            <LocationFields
              idPrefix={`address-${i}`}
              countries={countries}
              value={address}
              onChange={(patch) => setList((current) => current.map((a, idx) => (idx === i ? { ...a, ...patch } : a)))}
            />
            <div>
              <label className="field-label">PIN code</label>
              <input
                value={address.postalCode}
                inputMode="numeric"
                autoComplete="postal-code"
                onChange={(e) => update(i, "postalCode", e.target.value)}
                className="input"
              />
            </div>
          </div>
        </div>
      ))}
      {result && <Notice ok={result.ok}>{result.message}</Notice>}
      <div className="flex flex-wrap gap-3">
        {list.length < 5 && (
          <button type="button" onClick={() => setList([...list, { ...blank }])} className="btn btn-outline">
            <Plus size={15} /> Add address
          </button>
        )}
        <button type="button" disabled={pending} onClick={() => run(() => saveAddressesAction(list))} className="btn btn-primary">
          {pending ? "Saving…" : "Save addresses"}
        </button>
      </div>
    </div>
  );
}

function MeasurementsTab({ initial }: { initial: MeasurementProfile[] }) {
  const [list, setList] = useState<MeasurementProfile[]>(initial);
  const [open, setOpen] = useState<string | null>(initial[0]?.id ?? null);
  const { pending, result, run } = useSaver();
  const patch = (id: string, change: Partial<MeasurementProfile>) =>
    setList((current) => current.map((p) => (p.id === id ? { ...p, ...change } : p)));

  function add() {
    const profile: MeasurementProfile = { id: uid(), name: `Profile ${list.length + 1}`, unit: "in", values: {} };
    setList([...list, profile]);
    setOpen(profile.id);
  }

  return (
    <div className="space-y-5">
      <p className="max-w-xl text-sm text-muted">
        Save your measurements once and load them into any couture order. Leave anything you do not know blank.
      </p>
      {list.map((profile) => (
        <div key={profile.id} className="border border-line" style={{ borderRadius: "var(--radius)" }}>
          <div className="flex items-center justify-between gap-3 p-4 md:px-6">
            <button type="button" onClick={() => setOpen(open === profile.id ? null : profile.id)} className="flex-1 text-left">
              <span className="font-medium">{profile.name}</span>
              <span className="ml-3 text-xs text-muted">
                {Object.keys(profile.values).length} measurements · {profile.unit}
              </span>
            </button>
            <button
              type="button"
              aria-label="Delete profile"
              onClick={() => setList((current) => current.filter((p) => p.id !== profile.id))}
              className="p-1 text-muted hover:text-red-600"
            >
              <Trash2 size={16} strokeWidth={1.5} />
            </button>
          </div>
          {open === profile.id && (
            <div className="border-t border-line p-4 md:p-6">
              <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto]">
                <div>
                  <label className="field-label">Profile name</label>
                  <input value={profile.name} onChange={(e) => patch(profile.id, { name: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="field-label">Unit</label>
                  <select value={profile.unit} onChange={(e) => patch(profile.id, { unit: e.target.value as "in" | "cm" })} className="input">
                    <option value="in">Inches</option>
                    <option value="cm">Centimetres</option>
                  </select>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
                {Object.entries(MEASUREMENT_FIELDS).map(([key, meta]) => (
                  <div key={key}>
                    <label className="field-label" title={meta.hint}>
                      {meta.label}
                    </label>
                    <input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.25"
                      value={profile.values[key] ?? ""}
                      onChange={(e) => {
                        const values = { ...profile.values };
                        const value = Number(e.target.value);
                        if (value > 0) values[key] = value;
                        else delete values[key];
                        patch(profile.id, { values });
                      }}
                      className="input"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
      {result && <Notice ok={result.ok}>{result.message}</Notice>}
      <div className="flex flex-wrap gap-3">
        {list.length < 6 && (
          <button type="button" onClick={add} className="btn btn-outline">
            <Plus size={15} /> New profile
          </button>
        )}
        <button type="button" disabled={pending} onClick={() => run(() => saveMeasurementsAction(list))} className="btn btn-primary">
          {pending ? "Saving…" : "Save measurements"}
        </button>
      </div>
    </div>
  );
}

function ProfileTab({ user }: { user: AccountData["user"] }) {
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [passwords, setPasswords] = useState({ current: "", next: "" });
  const profile = useSaver();
  const password = useSaver();

  return (
    <div className="grid gap-12 md:grid-cols-2">
      <form
        className="grid h-fit gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          profile.run(() => updateProfileAction({ name, phone }));
        }}
      >
        <h2 className="text-2xl">Your details</h2>
        <div>
          <label className="field-label">Email</label>
          <input value={user.email} disabled className="input opacity-60" />
        </div>
        <div>
          <label className="field-label">Full name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required className="input" />
        </div>
        <div>
          <label className="field-label">Phone</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" className="input" />
        </div>
        {profile.result && <Notice ok={profile.result.ok}>{profile.result.message}</Notice>}
        <button type="submit" disabled={profile.pending} className="btn btn-primary w-fit">
          {profile.pending ? "Saving…" : "Save details"}
        </button>
      </form>

      <form
        className="grid h-fit gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          password.run(async () => {
            const result = await changePasswordAction(passwords);
            if (result.ok) setPasswords({ current: "", next: "" });
            return result;
          });
        }}
      >
        <h2 className="text-2xl">Change password</h2>
        <div>
          <label className="field-label">Current password</label>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={passwords.current}
            onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
            className="input"
          />
        </div>
        <div>
          <label className="field-label">New password</label>
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={passwords.next}
            onChange={(e) => setPasswords({ ...passwords, next: e.target.value })}
            className="input"
          />
        </div>
        {password.result && <Notice ok={password.result.ok}>{password.result.message}</Notice>}
        <button type="submit" disabled={password.pending} className="btn btn-outline w-fit">
          {password.pending ? "Updating…" : "Update password"}
        </button>
      </form>
    </div>
  );
}

export function AccountView({ data }: { data: AccountData }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Orders");
  const money = useMoney();

  return (
    <div>
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-3">My account</p>
          <h1 className="text-4xl md:text-6xl">Hello, {data.user.name.split(" ")[0]}</h1>
        </div>
        <form action={logoutAction}>
          <button type="submit" className="link-underline">
            Sign out
          </button>
        </form>
      </div>

      <div className="mb-10 flex gap-7 overflow-x-auto border-b border-line" role="tablist">
        {TABS.map((name) => (
          <button
            key={name}
            role="tab"
            aria-selected={tab === name}
            onClick={() => setTab(name)}
            className={cn(
              "-mb-px shrink-0 border-b-2 pb-3.5 text-[0.78rem] font-medium uppercase tracking-[0.14em] transition-colors",
              tab === name ? "border-fg text-fg" : "border-transparent text-muted hover:text-fg",
            )}
          >
            {name}
            {name === "Orders" && data.orders.length > 0 && <span className="ml-1.5 text-muted">({data.orders.length})</span>}
            {name === "Couture" && data.couture.length > 0 && <span className="ml-1.5 text-muted">({data.couture.length})</span>}
          </button>
        ))}
      </div>

      {tab === "Orders" &&
        (data.orders.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-muted">You have not placed an order yet.</p>
            <Link href="/shop" className="btn btn-primary mt-6">
              Start shopping
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-line border-y border-line">
            {data.orders.map((order) => (
              <li key={order.token}>
                <Link href={`/order/${order.token}`} className="flex items-center gap-4 py-5 transition-colors hover:bg-surface/60 md:px-3">
                  <div className="w-14 shrink-0 overflow-hidden bg-surface" style={{ aspectRatio: "3 / 4", borderRadius: "var(--radius)" }}>
                    <Picture src={order.image} alt="" width={160} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{order.number}</p>
                    <p className="mt-0.5 text-sm text-muted">
                      {order.date} · {order.items} {order.items === 1 ? "item" : "items"}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="tabular-nums">{money(order.total)}</span>
                    <StatusBadge status={order.status} label={ORDER_STATUS_LABELS[order.status as OrderStatus] ?? order.status} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ))}

      {tab === "Couture" &&
        (data.couture.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-muted">No couture requests yet.</p>
            <Link href="/couture" className="btn btn-primary mt-6">
              Explore couture
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-line border-y border-line">
            {data.couture.map((order) => (
              <li key={order.token}>
                <Link
                  href={`/couture/request/${order.token}`}
                  className="flex items-center justify-between gap-4 py-5 transition-colors hover:bg-surface/60 md:px-3"
                >
                  <div>
                    <p className="font-medium">{order.service}</p>
                    <p className="mt-0.5 text-sm text-muted">
                      {order.number} · {order.date}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="tabular-nums">{money(order.price)}</span>
                    <StatusBadge status={order.status} label={COUTURE_STATUS_LABELS[order.status as CoutureStatus] ?? order.status} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ))}

      {tab === "Addresses" && <AddressesTab initial={data.user.addresses} countries={data.countries} />}
      {tab === "Measurements" && <MeasurementsTab initial={data.user.measurements} />}
      {tab === "Profile" && <ProfileTab user={data.user} />}
    </div>
  );
}
