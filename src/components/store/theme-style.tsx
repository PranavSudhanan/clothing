import { fontStack, googleFontsUrl } from "@/lib/defaults";
import type { ThemeSettings } from "@/lib/types";

const HEX = /^#[0-9a-fA-F]{3,8}$/;
const color = (value: string, fallback: string) => (HEX.test(value) ? value : fallback);

/** Turns the saved theme into CSS custom properties. Also used by the admin live preview. */
export function themeVariables(theme: ThemeSettings): Record<string, string> {
  const c = theme.colors;
  const spacing = { compact: "3.25rem", comfortable: "5rem", spacious: "7rem" }[theme.sectionSpacing] ?? "5rem";
  const tracking = { tight: "-0.02em", normal: "0em", wide: "0.06em" }[theme.headingTracking] ?? "0em";
  const desktop = ["2", "3", "4", "5"].includes(theme.gridDesktop) ? Number(theme.gridDesktop) : 4;
  const mobile = theme.gridMobile === "1" ? 1 : 2;
  const aspect = ["3/4", "4/5", "1/1"].includes(theme.cardAspect) ? theme.cardAspect : "3/4";

  return {
    "--t-bg": color(c.bg, "#ffffff"),
    "--t-surface": color(c.surface, "#f4f4f4"),
    "--t-fg": color(c.fg, "#111111"),
    "--t-muted": color(c.muted, "#666666"),
    "--t-line": color(c.line, "#e2e2e2"),
    "--t-primary": color(c.primary, "#111111"),
    "--t-primary-fg": color(c.primaryFg, "#ffffff"),
    "--t-accent": color(c.accent, "#96763f"),
    "--t-accent-fg": color(c.accentFg, "#ffffff"),
    "--t-footer-bg": color(c.footerBg, "#111111"),
    "--t-footer-fg": color(c.footerFg, "#eeeeee"),
    "--t-announce-bg": color(c.announceBg, "#111111"),
    "--t-announce-fg": color(c.announceFg, "#ffffff"),
    "--f-heading": fontStack(theme.headingFont),
    "--f-body": fontStack(theme.bodyFont),
    "--heading-weight": /^[1-9]00$/.test(theme.headingWeight) ? theme.headingWeight : "500",
    "--heading-case": theme.headingCase === "uppercase" ? "uppercase" : "none",
    "--heading-tracking": theme.headingCase === "uppercase" && theme.headingTracking === "normal" ? "0.04em" : tracking,
    "--btn-case": theme.buttonCase === "uppercase" ? "uppercase" : "none",
    "--btn-tracking": theme.buttonCase === "uppercase" ? "0.14em" : "0.01em",
    "--radius": `${Math.min(Math.max(Number(theme.radius) || 0, 0), 40)}px`,
    "--container": `${Math.min(Math.max(Number(theme.containerWidth) || 1360, 960), 1920)}px`,
    "--section-y": spacing,
    "--card-aspect": aspect.replace("/", " / "),
    "--grid-desktop": String(desktop),
    "--grid-tablet": String(Math.max(2, desktop - 1)),
    "--grid-mobile": String(mobile),
  };
}

export function ThemeStyle({ theme }: { theme: ThemeSettings }) {
  const vars = themeVariables(theme);
  const fontSize = Math.min(Math.max(Number(theme.baseFontSize) || 16, 13), 20);
  const declarations = Object.entries(vars)
    .map(([name, value]) => `${name}:${value}`)
    .join(";");
  // Custom CSS is written by the store admin; neutralise anything that could close the tag.
  const custom = (theme.customCss || "").replace(/<\/?style/gi, "");
  const css = `:root{${declarations}}html{font-size:${fontSize}px}${custom}`;
  const fonts = googleFontsUrl([theme.headingFont, theme.bodyFont]);

  return (
    <>
      {fonts && (
        <>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link rel="stylesheet" href={fonts} precedence="default" />
        </>
      )}
      <style dangerouslySetInnerHTML={{ __html: css }} />
    </>
  );
}
