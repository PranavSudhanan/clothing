"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveSettingAction } from "@/lib/actions/admin";
import { changePasswordAction } from "@/lib/actions/store";
import type { Field, FieldValues } from "@/lib/fields";
import { COMMERCE_FIELDS, GENERAL_FIELDS, NAVIGATION_FIELDS, SEO_FIELDS } from "@/lib/resources";
import type { SettingKey, SiteConfig } from "@/lib/types";
import { cn } from "@/lib/utils";
import { FieldsForm } from "./fields-form";
import { Card, PageHeader, useToast } from "./ui";

/** One settings group: a schema-driven form with its own save button. */
function SettingForm({ settingKey, fields, initial }: { settingKey: SettingKey; fields: Field[]; initial: FieldValues }) {
  const router = useRouter();
  const toast = useToast();
  const [values, setValues] = useState<FieldValues>(initial);
  const [dirty, setDirty] = useState(false);
  const [pending, start] = useTransition();

  function save() {
    start(async () => {
      const result = await saveSettingAction(settingKey, values);
      toast(result);
      if (result.ok) {
        setDirty(false);
        router.refresh();
      }
    });
  }

  return (
    <>
      <FieldsForm
        fields={fields}
        values={values}
        onChange={(next) => {
          setValues(next);
          setDirty(true);
        }}
      />
      <div className="mt-6 flex items-center justify-end gap-3 border-t border-zinc-100 pt-4">
        {dirty && <span className="text-xs text-zinc-500">Unsaved changes</span>}
        <button type="button" disabled={pending} onClick={save} className="a-btn a-btn-primary">
          {pending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </>
  );
}

function PasswordForm() {
  const toast = useToast();
  const [values, setValues] = useState({ current: "", next: "", confirm: "" });
  const [pending, start] = useTransition();

  function save() {
    if (values.next !== values.confirm) return toast({ ok: false, message: "The new passwords do not match." });
    start(async () => {
      const result = await changePasswordAction({ current: values.current, next: values.next });
      toast(result);
      if (result.ok) setValues({ current: "", next: "", confirm: "" });
    });
  }

  return (
    <div className="grid max-w-sm gap-4">
      {(
        [
          ["current", "Current password", "current-password"],
          ["next", "New password", "new-password"],
          ["confirm", "Confirm new password", "new-password"],
        ] as const
      ).map(([key, label, autoComplete]) => (
        <div key={key}>
          <label className="a-label" htmlFor={`pw-${key}`}>
            {label}
          </label>
          <input
            id={`pw-${key}`}
            type="password"
            autoComplete={autoComplete}
            value={values[key]}
            onChange={(e) => setValues({ ...values, [key]: e.target.value })}
            className="a-input"
          />
        </div>
      ))}
      <p className="a-help !mt-0">Use at least 8 characters.</p>
      <button type="button" disabled={pending || !values.current || values.next.length < 8} onClick={save} className="a-btn a-btn-primary w-fit">
        {pending ? "Updating…" : "Update password"}
      </button>
    </div>
  );
}

const TABS = [
  { key: "general", label: "General" },
  { key: "commerce", label: "Checkout & shipping" },
  { key: "seo", label: "SEO" },
  { key: "account", label: "Admin account" },
] as const;

export function SettingsView({ config, razorpayReady, blobReady, embeddedDb }: { config: SiteConfig; razorpayReady: boolean; blobReady: boolean; embeddedDb: boolean }) {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("general");

  const checks = [
    { ok: !embeddedDb, label: "Database", good: "Connected to Postgres (DATABASE_URL)", bad: "Using the embedded development database — set DATABASE_URL before going live" },
    { ok: razorpayReady, label: "Online payments", good: "Razorpay keys found", bad: "Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to accept UPI and cards" },
    { ok: blobReady, label: "Image uploads", good: "Vercel Blob connected", bad: "Uploads are saved locally — connect Vercel Blob before deploying" },
  ];

  return (
    <>
      <PageHeader title="Settings" description="Store details, checkout rules and search engine defaults." />
      <div className="mb-5 flex gap-1 overflow-x-auto" role="tablist">
        {TABS.map((item) => (
          <button
            key={item.key}
            role="tab"
            aria-selected={tab === item.key}
            onClick={() => setTab(item.key)}
            className={cn("shrink-0 rounded-lg px-3 py-1.5 text-[13.5px] font-medium transition-colors", tab === item.key ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-200/70")}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "general" && (
        <Card>
          <SettingForm settingKey="general" fields={GENERAL_FIELDS} initial={config.general as unknown as FieldValues} />
        </Card>
      )}
      {tab === "commerce" && (
        <div className="space-y-5">
          <Card>
            <SettingForm settingKey="commerce" fields={COMMERCE_FIELDS} initial={config.commerce as unknown as FieldValues} />
          </Card>
          <Card title="Integrations" description="These are configured with environment variables, not from this panel.">
            <ul className="space-y-2.5">
              {checks.map((check) => (
                <li key={check.label} className="flex items-start gap-3 text-[13.5px]">
                  <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", check.ok ? "bg-emerald-500" : "bg-amber-500")} />
                  <span>
                    <span className="font-medium">{check.label}</span>
                    <span className="block text-zinc-500">{check.ok ? check.good : check.bad}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}
      {tab === "seo" && (
        <Card>
          <SettingForm settingKey="seo" fields={SEO_FIELDS} initial={config.seo as unknown as FieldValues} />
        </Card>
      )}
      {tab === "account" && (
        <Card title="Change password">
          <PasswordForm />
        </Card>
      )}
    </>
  );
}

export function NavigationView({ initial }: { initial: SiteConfig["navigation"] }) {
  return (
    <>
      <PageHeader title="Navigation" description="The announcement bar, the header menu and the footer. Links can point to any page, collection or outside website." />
      <Card>
        <SettingForm settingKey="navigation" fields={NAVIGATION_FIELDS} initial={initial as unknown as FieldValues} />
      </Card>
    </>
  );
}
