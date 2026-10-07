// Shared types used by the database schema, the storefront and the admin panel.

export type Address = {
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  /** ISO codes behind the country and state dropdowns. Absent on addresses saved before they existed. */
  countryCode?: string;
  stateCode?: string;
};

export type ColorOption = { name: string; hex: string };

export type StyleOption = {
  name: string;
  choices: { label: string; priceDelta: number }[];
};

export type TimelineEntry = { at: string; status: string; note?: string };

export type MeasurementProfile = {
  id: string;
  name: string;
  unit: "in" | "cm";
  values: Record<string, number>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SectionData = Record<string, any>;

export type Section = {
  id: string;
  type: string;
  enabled: boolean;
  data: SectionData;
};

export type LinkItem = { label: string; href: string };
export type NavItem = LinkItem & { children?: LinkItem[] };

export type GeneralSettings = {
  storeName: string;
  tagline: string;
  logoUrl: string;
  logoHeight: number;
  faviconUrl: string;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  hours: string;
  instagram: string;
  facebook: string;
  youtube: string;
  x: string;
};

export type CommerceSettings = {
  currency: string;
  locale: string;
  shippingFlat: number;
  freeShippingAbove: number;
  taxRate: number;
  taxInclusive: boolean;
  codEnabled: boolean;
  onlineEnabled: boolean;
  orderPrefix: string;
  lowStockThreshold: number;
  deliveryNote: string;
  returnsNote: string;
  /** ISO country codes offered at checkout. Empty means every country. */
  shippingCountries: string[];
};

export type SeoSettings = {
  title: string;
  description: string;
  ogImage: string;
};

export type ThemeSettings = {
  colors: {
    bg: string;
    surface: string;
    fg: string;
    muted: string;
    line: string;
    primary: string;
    primaryFg: string;
    accent: string;
    accentFg: string;
    footerBg: string;
    footerFg: string;
    announceBg: string;
    announceFg: string;
  };
  headingFont: string;
  bodyFont: string;
  headingWeight: string;
  headingCase: "normal" | "uppercase";
  headingTracking: "tight" | "normal" | "wide";
  baseFontSize: number;
  radius: number;
  buttonStyle: "solid" | "outline";
  buttonCase: "normal" | "uppercase";
  containerWidth: number;
  sectionSpacing: "compact" | "comfortable" | "spacious";
  headerLayout: "left" | "center";
  headerSticky: boolean;
  headerSearch: boolean;
  headerWishlist: boolean;
  cardAspect: "3/4" | "4/5" | "1/1";
  cardAlign: "left" | "center";
  cardQuickAdd: boolean;
  cardHoverImage: boolean;
  cardSwatches: boolean;
  gridDesktop: string;
  gridMobile: string;
  customCss: string;
};

export type NavigationSettings = {
  announcementEnabled: boolean;
  announcements: { text: string; href?: string }[];
  header: NavItem[];
  footerAbout: string;
  footerColumns: { title: string; links: LinkItem[] }[];
  footerBottom: string;
  footerNewsletter: boolean;
};

export type SiteConfig = {
  general: GeneralSettings;
  commerce: CommerceSettings;
  seo: SeoSettings;
  theme: ThemeSettings;
  navigation: NavigationSettings;
};

export type SettingKey = keyof SiteConfig;

export type CartLine = {
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  image: string;
  size: string;
  color: string;
  price: number;
  qty: number;
  stock: number;
};

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = ["unpaid", "paid", "refunded"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const COUTURE_STATUSES = [
  "requested",
  "confirmed",
  "measurement",
  "cutting",
  "stitching",
  "trial",
  "ready",
  "delivered",
  "cancelled",
] as const;
export type CoutureStatus = (typeof COUTURE_STATUSES)[number];

export const COUTURE_STATUS_LABELS: Record<CoutureStatus, string> = {
  requested: "Request received",
  confirmed: "Confirmed",
  measurement: "Measurements taken",
  cutting: "Cutting",
  stitching: "Stitching",
  trial: "Trial fitting",
  ready: "Ready",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
};

export const MEASUREMENT_METHODS = {
  self: "I'll enter my measurements",
  store: "Book a store visit",
  home: "Book a home visit",
  garment: "Send a reference garment",
} as const;
export type MeasurementMethod = keyof typeof MEASUREMENT_METHODS;

/** Every measurement a couture service can ask for. */
export const MEASUREMENT_FIELDS: Record<string, { label: string; hint: string }> = {
  neck: { label: "Neck", hint: "Around the base of the neck" },
  shoulder: { label: "Shoulder", hint: "Shoulder point to shoulder point, across the back" },
  chest: { label: "Chest", hint: "Around the fullest part of the chest" },
  waist: { label: "Waist", hint: "Around the natural waistline" },
  stomach: { label: "Stomach", hint: "Around the fullest part of the stomach" },
  hip: { label: "Hip / Seat", hint: "Around the fullest part of the seat" },
  sleeve: { label: "Sleeve length", hint: "Shoulder point to wrist" },
  bicep: { label: "Bicep", hint: "Around the fullest part of the upper arm" },
  wrist: { label: "Wrist", hint: "Around the wrist bone" },
  jacketLength: { label: "Jacket length", hint: "Base of collar to desired hem" },
  shirtLength: { label: "Shirt length", hint: "Base of collar to desired hem" },
  waistcoatLength: { label: "Waistcoat length", hint: "Shoulder seam to the waistcoat point, over the waistband" },
  trouserWaist: { label: "Trouser waist", hint: "Where you wear your trousers" },
  trouserLength: { label: "Trouser length", hint: "Waistband to floor, along the outer leg" },
  rise: { label: "Rise", hint: "Top of the waistband to the crotch seam" },
  inseam: { label: "Inseam", hint: "Crotch to floor, along the inner leg" },
  thigh: { label: "Thigh", hint: "Around the fullest part of the thigh" },
  knee: { label: "Knee", hint: "Around the knee" },
  ankle: { label: "Ankle / Bottom", hint: "Desired trouser opening" },
  height: { label: "Height", hint: "Without shoes" },
};

/** Style choices in the order they are offered. Rows written before this was an array hold a plain object. */
export type StyleSelections = { name: string; value: string }[] | Record<string, string>;

export function styleEntries(value: StyleSelections | null | undefined): [string, string][] {
  if (!value) return [];
  return Array.isArray(value) ? value.map((item) => [item.name, item.value]) : Object.entries(value);
}

/** Measurements in head-to-toe order, however the database returned them. */
export function measurementEntries(values: Record<string, number> | null | undefined): [string, number][] {
  const order = Object.keys(MEASUREMENT_FIELDS);
  const rank = (key: string) => (order.includes(key) ? order.indexOf(key) : order.length);
  return Object.entries(values ?? {}).sort(([a], [b]) => rank(a) - rank(b));
}
