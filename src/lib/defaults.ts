import type { SiteConfig, ThemeSettings } from "./types";

/** Google Fonts offered in the theme editor, with the weights each family actually ships. */
export const FONTS: Record<string, { weights: string; fallback: "serif" | "sans-serif" }> = {
  "Cormorant Garamond": { weights: "400;500;600;700", fallback: "serif" },
  "Playfair Display": { weights: "400;500;600;700", fallback: "serif" },
  "Bodoni Moda": { weights: "400;500;600;700", fallback: "serif" },
  Fraunces: { weights: "400;500;600;700", fallback: "serif" },
  "EB Garamond": { weights: "400;500;600;700", fallback: "serif" },
  "DM Serif Display": { weights: "400", fallback: "serif" },
  Marcellus: { weights: "400", fallback: "serif" },
  Jost: { weights: "300;400;500;600;700", fallback: "sans-serif" },
  Inter: { weights: "300;400;500;600;700", fallback: "sans-serif" },
  "DM Sans": { weights: "300;400;500;600;700", fallback: "sans-serif" },
  Manrope: { weights: "300;400;500;600;700", fallback: "sans-serif" },
  "Work Sans": { weights: "300;400;500;600;700", fallback: "sans-serif" },
  Poppins: { weights: "300;400;500;600;700", fallback: "sans-serif" },
  Montserrat: { weights: "300;400;500;600;700", fallback: "sans-serif" },
  Outfit: { weights: "300;400;500;600;700", fallback: "sans-serif" },
  "Space Grotesk": { weights: "300;400;500;600;700", fallback: "sans-serif" },
  Syne: { weights: "400;500;600;700", fallback: "sans-serif" },
};

export function fontStack(name: string) {
  const font = FONTS[name];
  if (!font) return "system-ui, sans-serif";
  return `"${name}", ${font.fallback === "serif" ? "Georgia, 'Times New Roman', serif" : "system-ui, -apple-system, 'Segoe UI', sans-serif"}`;
}

export function googleFontsUrl(names: string[]) {
  const families = [...new Set(names)]
    .filter((n) => FONTS[n])
    .map((n) => `family=${n.replace(/ /g, "+")}:wght@${FONTS[n].weights}`);
  if (families.length === 0) return "";
  return `https://fonts.googleapis.com/css2?${families.join("&")}&display=swap`;
}

export const DEFAULT_THEME: ThemeSettings = {
  colors: {
    bg: "#faf8f4",
    surface: "#f0ebe2",
    fg: "#1b1916",
    muted: "#6b655c",
    line: "#ddd5c8",
    primary: "#1b1916",
    primaryFg: "#faf8f4",
    accent: "#96763f",
    accentFg: "#ffffff",
    footerBg: "#16140f",
    footerFg: "#e9e3d8",
    announceBg: "#1b1916",
    announceFg: "#f2ece0",
  },
  headingFont: "Cormorant Garamond",
  bodyFont: "Jost",
  headingWeight: "500",
  headingCase: "normal",
  headingTracking: "normal",
  baseFontSize: 16,
  radius: 0,
  buttonStyle: "solid",
  buttonCase: "uppercase",
  containerWidth: 1360,
  sectionSpacing: "comfortable",
  headerLayout: "left",
  headerSticky: true,
  headerSearch: true,
  headerWishlist: true,
  cardAspect: "3/4",
  cardAlign: "left",
  cardQuickAdd: true,
  cardHoverImage: true,
  cardSwatches: true,
  gridDesktop: "4",
  gridMobile: "2",
  customCss: "",
};

type Preset = { label: string; description: string; theme: Partial<ThemeSettings> };

export const THEME_PRESETS: Record<string, Preset> = {
  atelier: {
    label: "Atelier",
    description: "Warm ivory, ink and brass. Editorial serif headings.",
    theme: {
      colors: DEFAULT_THEME.colors,
      headingFont: "Cormorant Garamond",
      bodyFont: "Jost",
      headingWeight: "500",
      headingCase: "normal",
      radius: 0,
      buttonCase: "uppercase",
    },
  },
  noir: {
    label: "Noir",
    description: "Dark, cinematic and gold-accented.",
    theme: {
      colors: {
        bg: "#0f0f0f",
        surface: "#1a1a19",
        fg: "#f1ede4",
        muted: "#a19b8f",
        line: "#2e2d2a",
        primary: "#f1ede4",
        primaryFg: "#0f0f0f",
        accent: "#c9a765",
        accentFg: "#0f0f0f",
        footerBg: "#080808",
        footerFg: "#d9d3c7",
        announceBg: "#c9a765",
        announceFg: "#0f0f0f",
      },
      headingFont: "Playfair Display",
      bodyFont: "Manrope",
      headingWeight: "500",
      headingCase: "normal",
      radius: 0,
      buttonCase: "uppercase",
    },
  },
  minimal: {
    label: "Minimal",
    description: "Crisp white, black type, clean sans-serif.",
    theme: {
      colors: {
        bg: "#ffffff",
        surface: "#f5f5f4",
        fg: "#0c0c0c",
        muted: "#6e6e6e",
        line: "#e5e5e5",
        primary: "#0c0c0c",
        primaryFg: "#ffffff",
        accent: "#0c0c0c",
        accentFg: "#ffffff",
        footerBg: "#f5f5f4",
        footerFg: "#0c0c0c",
        announceBg: "#0c0c0c",
        announceFg: "#ffffff",
      },
      headingFont: "Inter",
      bodyFont: "Inter",
      headingWeight: "600",
      headingCase: "normal",
      radius: 6,
      buttonCase: "normal",
    },
  },
  heritage: {
    label: "Heritage",
    description: "Cream and deep bottle green with a burgundy accent.",
    theme: {
      colors: {
        bg: "#f6f1e7",
        surface: "#ebe3d3",
        fg: "#1d2b24",
        muted: "#5d6a62",
        line: "#d6ccb8",
        primary: "#1f3a2d",
        primaryFg: "#f6f1e7",
        accent: "#7b2d32",
        accentFg: "#ffffff",
        footerBg: "#1f3a2d",
        footerFg: "#ece5d6",
        announceBg: "#7b2d32",
        announceFg: "#f6f1e7",
      },
      headingFont: "Fraunces",
      bodyFont: "Work Sans",
      headingWeight: "500",
      headingCase: "normal",
      radius: 2,
      buttonCase: "uppercase",
    },
  },
  slate: {
    label: "Slate",
    description: "Cool greys with a navy accent. Modern and sharp.",
    theme: {
      colors: {
        bg: "#f4f5f7",
        surface: "#e8eaee",
        fg: "#161a22",
        muted: "#5f6775",
        line: "#d3d7de",
        primary: "#18233a",
        primaryFg: "#ffffff",
        accent: "#2f4f8f",
        accentFg: "#ffffff",
        footerBg: "#121722",
        footerFg: "#dfe3ea",
        announceBg: "#18233a",
        announceFg: "#ffffff",
      },
      headingFont: "Syne",
      bodyFont: "DM Sans",
      headingWeight: "600",
      headingCase: "uppercase",
      radius: 4,
      buttonCase: "uppercase",
    },
  },
};

export const DEFAULT_CONFIG: SiteConfig = {
  general: {
    storeName: "Atelier",
    tagline: "Ready-to-wear & bespoke menswear",
    logoUrl: "",
    logoHeight: 32,
    faviconUrl: "",
    email: "hello@example.com",
    phone: "+91 98765 43210",
    whatsapp: "919876543210",
    address: "12 Tailor's Lane, Linking Road, Bandra West, Mumbai 400050",
    hours: "Mon – Sat, 11am – 8pm",
    instagram: "https://instagram.com",
    facebook: "https://facebook.com",
    youtube: "",
    x: "",
  },
  commerce: {
    currency: "INR",
    locale: "en-IN",
    shippingFlat: 149,
    freeShippingAbove: 2999,
    taxRate: 0,
    taxInclusive: true,
    codEnabled: true,
    onlineEnabled: true,
    orderPrefix: "AT",
    lowStockThreshold: 5,
    deliveryNote: "Dispatched within 24 hours. Delivered in 3 – 6 business days.",
    returnsNote: "Easy 7-day returns and exchanges on ready-to-wear.",
  },
  seo: {
    title: "Atelier — Ready-to-wear & bespoke menswear",
    description:
      "Shop considered menswear essentials, or have a suit, blazer or shirt cut and stitched to your measurements by our master tailors.",
    ogImage: "",
  },
  theme: DEFAULT_THEME,
  navigation: {
    announcementEnabled: true,
    announcements: [
      { text: "Free shipping on orders above ₹2,999", href: "/shop" },
      { text: "Bespoke tailoring — book your fitting today", href: "/couture" },
    ],
    header: [
      {
        label: "Shop",
        href: "/shop",
        children: [
          { label: "All ready-to-wear", href: "/shop" },
          { label: "Shirts", href: "/collections/shirts" },
          { label: "Suits & Blazers", href: "/collections/suits-and-blazers" },
          { label: "Trousers", href: "/collections/trousers" },
          { label: "T-Shirts & Polos", href: "/collections/t-shirts-and-polos" },
          { label: "Jackets", href: "/collections/jackets" },
          { label: "Denim", href: "/collections/denim" },
        ],
      },
      { label: "New Arrivals", href: "/shop?sort=newest" },
      {
        label: "Couture",
        href: "/couture",
        children: [
          { label: "The couture house", href: "/couture" },
          { label: "Two-piece suit", href: "/couture/two-piece-suit" },
          { label: "Three-piece suit", href: "/couture/three-piece-suit" },
          { label: "Tuxedo", href: "/couture/tuxedo" },
          { label: "Blazer", href: "/couture/blazer" },
          { label: "Formal shirt", href: "/couture/formal-shirt" },
        ],
      },
      { label: "Our Story", href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
    footerAbout:
      "A menswear house built on two crafts: considered ready-to-wear, and garments cut and stitched for one person at a time.",
    footerColumns: [
      {
        title: "Shop",
        links: [
          { label: "All products", href: "/shop" },
          { label: "Shirts", href: "/collections/shirts" },
          { label: "Suits & Blazers", href: "/collections/suits-and-blazers" },
          { label: "Jackets", href: "/collections/jackets" },
        ],
      },
      {
        title: "Couture",
        links: [
          { label: "How it works", href: "/couture" },
          { label: "Two-piece suit", href: "/couture/two-piece-suit" },
          { label: "Three-piece suit", href: "/couture/three-piece-suit" },
          { label: "Track an order", href: "/track" },
        ],
      },
      {
        title: "Help",
        links: [
          { label: "Contact us", href: "/contact" },
          { label: "Shipping & returns", href: "/shipping-returns" },
          { label: "Privacy policy", href: "/privacy" },
          { label: "Terms of service", href: "/terms" },
        ],
      },
    ],
    footerBottom: "Crafted with care in India.",
    footerNewsletter: true,
  },
};

/** Deep-merges stored settings over defaults so newly added options always have a value. */
export function mergeConfig<T>(base: T, override: unknown): T {
  if (override === null || override === undefined) return base;
  if (Array.isArray(base)) return (Array.isArray(override) ? override : base) as T;
  if (typeof base === "object" && base !== null) {
    if (typeof override !== "object" || Array.isArray(override)) return base;
    const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
    for (const [key, value] of Object.entries(override as Record<string, unknown>)) {
      out[key] = key in out ? mergeConfig(out[key], value) : value;
    }
    return out as T;
  }
  return (typeof override === typeof base ? override : base) as T;
}
