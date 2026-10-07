"use client";

import { Check, Heart, Search, ShoppingBag, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition, type CSSProperties } from "react";
import { themeVariables } from "@/components/store/theme-style";
import { saveSettingAction } from "@/lib/actions/admin";
import { DEFAULT_THEME, googleFontsUrl, THEME_PRESETS } from "@/lib/defaults";
import type { FieldValues } from "@/lib/fields";
import { THEME_COLOR_FIELDS, THEME_LAYOUT_FIELDS, THEME_TYPOGRAPHY_FIELDS } from "@/lib/resources";
import type { ThemeSettings } from "@/lib/types";
import { cn } from "@/lib/utils";
import { FieldsForm } from "./fields-form";
import { Card, PageHeader, useToast } from "./ui";

type ColorKey = keyof ThemeSettings["colors"];

/** The working palette (--c-*) is resolved at :root, so the preview has to restate it locally. */
function previewStyle(theme: ThemeSettings): CSSProperties {
  const vars = themeVariables(theme);
  const working: Record<string, string> = {
    "--c-bg": vars["--t-bg"],
    "--c-surface": vars["--t-surface"],
    "--c-fg": vars["--t-fg"],
    "--c-muted": vars["--t-muted"],
    "--c-line": vars["--t-line"],
    "--c-primary": vars["--t-primary"],
    "--c-primary-fg": vars["--t-primary-fg"],
    "--c-accent": vars["--t-accent"],
    "--c-accent-fg": vars["--t-accent-fg"],
  };
  return { ...vars, ...working, fontSize: `${Math.min(Math.max(Number(theme.baseFontSize) || 16, 13), 20) * 0.8}px` } as CSSProperties;
}

function Preview({ theme, storeName }: { theme: ThemeSettings; storeName: string }) {
  const style = useMemo(() => previewStyle(theme), [theme]);
  const fonts = googleFontsUrl([theme.headingFont, theme.bodyFont]);
  const cards = [
    { name: "Linen Blazer", price: "₹12,999", was: "₹15,999", tone: "#cdb893" },
    { name: "Poplin Shirt", price: "₹2,499", was: "", tone: "#dfe3e8" },
    { name: "Stretch Chinos", price: "₹2,999", was: "", tone: "#a39678" },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 shadow-sm">
      {fonts && <link rel="stylesheet" href={fonts} />}
      <div className="store !min-h-0" style={style}>
        <div className="px-3 py-1.5 text-center text-[0.6em] font-medium uppercase tracking-[0.16em]" style={{ background: "var(--t-announce-bg)", color: "var(--t-announce-fg)" }}>
          Free shipping on orders above ₹2,999
        </div>
        <div className={cn("flex items-center border-b border-line px-4 py-3", theme.headerLayout === "center" ? "justify-between" : "gap-6")}>
          {theme.headerLayout === "center" && <span className="text-[0.62em] uppercase tracking-[0.14em]">Shop · Couture</span>}
          <span className="heading text-[1.5em] tracking-[0.08em]">{storeName}</span>
          {theme.headerLayout !== "center" && <span className="flex-1 text-[0.62em] uppercase tracking-[0.14em]">Shop · Couture · Story</span>}
          <span className="flex gap-2.5">
            {theme.headerSearch && <Search size={14} strokeWidth={1.4} />}
            <User size={14} strokeWidth={1.4} />
            {theme.headerWishlist && <Heart size={14} strokeWidth={1.4} />}
            <ShoppingBag size={14} strokeWidth={1.4} />
          </span>
        </div>

        <div data-tone="dark" className="px-5 py-8">
          <p className="eyebrow !text-[0.6em]">The couture house</p>
          <p className="heading mt-2 text-[2.3em]">Made to your measure</p>
          <p className="mt-2 max-w-xs text-[0.85em] text-muted">Suits, blazers and shirts — cut and stitched for you alone.</p>
          <div className="mt-4 flex gap-2">
            <span className="btn btn-primary !min-h-0 !px-3.5 !py-2.5 !text-[0.62em]">Start your order</span>
            <span className="btn btn-outline !min-h-0 !px-3.5 !py-2.5 !text-[0.62em]">Explore</span>
          </div>
        </div>

        <div className="px-5 py-6">
          <p className="eyebrow !text-[0.6em]">The edit</p>
          <p className="heading mb-4 mt-1 text-[1.7em]">Featured pieces</p>
          <div className="grid grid-cols-3 gap-2.5">
            {cards.map((card, i) => (
              <div key={card.name} className={cn(theme.cardAlign === "center" && "text-center")}>
                <div className="relative" style={{ aspectRatio: "var(--card-aspect)", background: card.tone, borderRadius: "var(--radius)" }}>
                  {i === 0 && <span className="absolute left-1.5 top-1.5 bg-accent px-1.5 py-0.5 text-[0.5em] font-medium uppercase tracking-[0.12em] text-accent-fg">−19%</span>}
                </div>
                <p className="mt-2 text-[0.78em] leading-tight">{card.name}</p>
                <p className="mt-0.5 text-[0.72em]">
                  <span className={cn(card.was && "text-accent")}>{card.price}</span> {card.was && <s className="text-muted">{card.was}</s>}
                </p>
                {theme.cardSwatches && i === 0 && (
                  <span className={cn("mt-1 flex gap-1", theme.cardAlign === "center" && "justify-center")}>
                    <span className="h-2 w-2 rounded-full bg-[#cdb893]" />
                    <span className="h-2 w-2 rounded-full bg-[#a7a39b]" />
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div data-tone="surface" className="px-5 py-5">
          <p className="heading text-[1.3em]">Join the list</p>
          <div className="mt-2.5 flex gap-2">
            <span className="input !min-h-0 flex-1 !px-2.5 !py-2 !text-[0.72em] text-muted">Your email address</span>
            <span className="btn btn-accent !min-h-0 !px-3 !py-2 !text-[0.62em]">Subscribe</span>
          </div>
        </div>

        <div className="px-5 py-4 text-[0.68em]" style={{ background: "var(--t-footer-bg)", color: "var(--t-footer-fg)" }}>
          <span className="heading text-[1.6em] tracking-[0.08em]">{storeName}</span>
          <p className="mt-1 opacity-70">© {storeName}. Crafted with care in India.</p>
        </div>
      </div>
    </div>
  );
}

export function ThemeEditor({ initial, storeName }: { initial: ThemeSettings; storeName: string }) {
  const router = useRouter();
  const toast = useToast();
  const [theme, setTheme] = useState<ThemeSettings>(initial);
  const [dirty, setDirty] = useState(false);
  const [pending, start] = useTransition();

  const update = (next: ThemeSettings) => {
    setTheme(next);
    setDirty(true);
  };
  const setColor = (key: ColorKey, value: string) => update({ ...theme, colors: { ...theme.colors, [key]: value } });
  const patch = (values: FieldValues) => update({ ...theme, ...(values as Partial<ThemeSettings>) });

  function save() {
    start(async () => {
      const result = await saveSettingAction("theme", theme as unknown as Record<string, unknown>);
      toast(result);
      if (result.ok) {
        setDirty(false);
        router.refresh();
      }
    });
  }

  const activePreset = Object.entries(THEME_PRESETS).find(
    ([, preset]) => JSON.stringify(preset.theme.colors) === JSON.stringify(theme.colors) && preset.theme.headingFont === theme.headingFont,
  )?.[0];

  return (
    <>
      <PageHeader
        title="Theme"
        description="Colours, type and layout for the whole storefront. The preview updates as you edit; customers see changes once you save."
        actions={
          <>
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Reset every theme option to the original Atelier look?")) update(DEFAULT_THEME);
              }}
              className="a-btn"
            >
              Reset
            </button>
            <button type="button" disabled={pending || !dirty} onClick={save} className="a-btn a-btn-primary">
              {pending ? "Saving…" : dirty ? "Save theme" : "Saved"}
            </button>
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-5">
          <Card title="Start from a preset" description="Sets colours and fonts in one click. You can fine-tune everything afterwards.">
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-5">
              {Object.entries(THEME_PRESETS).map(([key, preset]) => {
                const colors = preset.theme.colors!;
                const active = key === activePreset;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => update({ ...theme, ...preset.theme, colors: { ...colors } })}
                    title={preset.description}
                    className={cn("rounded-xl border p-2.5 text-left transition", active ? "border-zinc-900 ring-1 ring-zinc-900" : "border-zinc-200 hover:border-zinc-400")}
                  >
                    <span className="flex h-12 overflow-hidden rounded-lg border border-black/5">
                      <span className="flex-[2]" style={{ background: colors.bg }} />
                      <span className="flex-1" style={{ background: colors.surface }} />
                      <span className="flex-1" style={{ background: colors.primary }} />
                      <span className="flex-1" style={{ background: colors.accent }} />
                    </span>
                    <span className="mt-2 flex items-center justify-between text-[13px] font-medium">
                      {preset.label}
                      {active && <Check size={14} />}
                    </span>
                  </button>
                );
              })}
            </div>
          </Card>

          <Card title="Colours">
            <div className="grid gap-x-4 gap-y-3.5 sm:grid-cols-2 xl:grid-cols-3">
              {THEME_COLOR_FIELDS.map((field) => {
                const value = theme.colors[field.name as ColorKey];
                return (
                  <div key={field.name}>
                    <label className="a-label" htmlFor={`color-${field.name}`} title={field.help}>
                      {field.label}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        aria-label={`${field.label} picker`}
                        value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : "#000000"}
                        onChange={(e) => setColor(field.name as ColorKey, e.target.value)}
                        className="h-[38px] w-11 shrink-0 cursor-pointer rounded-lg border border-zinc-300 bg-white p-1"
                      />
                      <input id={`color-${field.name}`} value={value} onChange={(e) => setColor(field.name as ColorKey, e.target.value)} className="a-input font-mono" />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card title="Typography">
            <FieldsForm fields={THEME_TYPOGRAPHY_FIELDS} values={theme as unknown as FieldValues} onChange={patch} />
          </Card>

          <Card title="Layout">
            <FieldsForm fields={THEME_LAYOUT_FIELDS} values={theme as unknown as FieldValues} onChange={patch} />
          </Card>

          <Card title="Custom CSS" description="For developers. Added after the theme styles on every storefront page.">
            <textarea
              value={theme.customCss}
              onChange={(e) => update({ ...theme, customCss: e.target.value })}
              rows={7}
              spellCheck={false}
              placeholder={".store .btn { letter-spacing: 0.2em; }"}
              aria-label="Custom CSS"
              className="a-input font-mono !text-[13px]"
            />
          </Card>
        </div>

        <div>
          <div className="lg:sticky lg:top-6">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Live preview</p>
            <Preview theme={theme} storeName={storeName} />
          </div>
        </div>
      </div>
    </>
  );
}
