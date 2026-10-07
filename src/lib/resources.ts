import { FONTS } from "./defaults";
import type { Field } from "./fields";

// Form + table definitions for the admin panel. Pure data, shared by server and client.

export type Column = {
  key: string;
  label: string;
  type?: "text" | "image" | "money" | "boolean" | "color" | "date" | "count";
};

export type ResourceConfig = {
  key: "banners" | "categories" | "coupons" | "fabrics" | "services";
  singular: string;
  plural: string;
  description: string;
  titleField: string;
  fields: Field[];
  columns: Column[];
  defaults: Record<string, unknown>;
};

const active: Field = { name: "active", label: "Visible on the storefront", type: "boolean" };
const sort: Field = { name: "sort", label: "Sort order", type: "number", width: "half", help: "Lower numbers appear first" };

export const RESOURCES: Record<ResourceConfig["key"], ResourceConfig> = {
  banners: {
    key: "banners",
    singular: "banner",
    plural: "Banners",
    description:
      "Slides for hero sections. Banners are grouped by placement — add a “Hero banner slider” section to any page and point it at a group.",
    titleField: "title",
    columns: [
      { key: "image", label: "", type: "image" },
      { key: "title", label: "Title" },
      { key: "placement", label: "Group" },
      { key: "sort", label: "Order", type: "count" },
      { key: "active", label: "Live", type: "boolean" },
    ],
    fields: [
      { name: "placement", label: "Banner group", type: "placement", help: "e.g. home-hero or couture-hero. Type a new name to start a new group." },
      { name: "image", label: "Image (desktop)", type: "image", help: "Landscape, at least 1920px wide" },
      { name: "mobileImage", label: "Image (mobile, optional)", type: "image", help: "Portrait crop shown on phones" },
      { name: "eyebrow", label: "Eyebrow", type: "text", help: "Small label above the title" },
      { name: "title", label: "Title", type: "text", required: true },
      { name: "subtitle", label: "Subtitle", type: "textarea" },
      { name: "ctaLabel", label: "Button label", type: "text", width: "half" },
      { name: "ctaHref", label: "Button link", type: "link", width: "half" },
      { name: "cta2Label", label: "Second button label", type: "text", width: "half" },
      { name: "cta2Href", label: "Second button link", type: "link", width: "half" },
      {
        name: "align",
        label: "Text alignment",
        type: "select",
        width: "half",
        options: [
          { value: "left", label: "Left" },
          { value: "center", label: "Centre" },
          { value: "right", label: "Right" },
        ],
      },
      { name: "overlay", label: "Image darkness (0–90)", type: "number", width: "half", help: "Higher makes text easier to read" },
      { name: "startsAt", label: "Show from", type: "datetime", width: "half", help: "Optional schedule" },
      { name: "endsAt", label: "Show until", type: "datetime", width: "half" },
      sort,
      active,
    ],
    defaults: { placement: "home-hero", align: "left", overlay: 40, sort: 0, active: true },
  },
  categories: {
    key: "categories",
    singular: "category",
    plural: "Categories",
    description: "Groups of ready-to-wear products. Each category gets its own page at /collections/…",
    titleField: "name",
    columns: [
      { key: "image", label: "", type: "image" },
      { key: "name", label: "Name" },
      { key: "slug", label: "URL" },
      { key: "sort", label: "Order", type: "count" },
      { key: "active", label: "Live", type: "boolean" },
    ],
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "slug", label: "URL slug", type: "text", help: "Leave empty to generate from the name" },
      { name: "description", label: "Description", type: "textarea" },
      { name: "image", label: "Image", type: "image", help: "Portrait works best (4:5)" },
      sort,
      active,
    ],
    defaults: { sort: 0, active: true },
  },
  coupons: {
    key: "coupons",
    singular: "coupon",
    plural: "Coupons",
    description: "Discount codes customers enter at checkout.",
    titleField: "code",
    columns: [
      { key: "code", label: "Code" },
      { key: "description", label: "Description" },
      { key: "value", label: "Value", type: "count" },
      { key: "usedCount", label: "Used", type: "count" },
      { key: "active", label: "Live", type: "boolean" },
    ],
    fields: [
      { name: "code", label: "Code", type: "text", required: true, placeholder: "WELCOME10" },
      { name: "description", label: "Internal note", type: "text" },
      {
        name: "type",
        label: "Discount type",
        type: "select",
        width: "half",
        options: [
          { value: "percent", label: "Percentage off" },
          { value: "fixed", label: "Fixed amount off" },
        ],
      },
      { name: "value", label: "Value", type: "number", width: "half", help: "10 = 10% or ₹10, depending on type" },
      { name: "minOrder", label: "Minimum order", type: "number", width: "half", help: "0 = no minimum" },
      { name: "maxDiscount", label: "Maximum discount", type: "number", width: "half", help: "0 = no cap" },
      { name: "usageLimit", label: "Total uses allowed", type: "number", width: "half", help: "0 = unlimited" },
      { name: "_gap", label: "", type: "heading", width: "half" },
      { name: "startsAt", label: "Valid from", type: "datetime", width: "half" },
      { name: "endsAt", label: "Valid until", type: "datetime", width: "half" },
      { name: "active", label: "Active", type: "boolean" },
    ],
    defaults: { type: "percent", value: 10, minOrder: 0, maxDiscount: 0, usageLimit: 0, active: true },
  },
  fabrics: {
    key: "fabrics",
    singular: "fabric",
    plural: "Fabrics",
    description: "The cloths clients can pick when ordering couture.",
    titleField: "name",
    columns: [
      { key: "hex", label: "", type: "color" },
      { key: "name", label: "Name" },
      { key: "material", label: "Material" },
      { key: "priceDelta", label: "Surcharge", type: "money" },
      { key: "active", label: "Live", type: "boolean" },
    ],
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "material", label: "Material", type: "text", placeholder: "Super 110s wool" },
      { name: "description", label: "Description", type: "textarea" },
      { name: "hex", label: "Swatch colour", type: "color", width: "half" },
      { name: "priceDelta", label: "Surcharge", type: "number", width: "half", help: "Added to the service's base price" },
      { name: "image", label: "Swatch photo (optional)", type: "image" },
      sort,
      active,
    ],
    defaults: { hex: "#3a3d42", priceDelta: 0, sort: 0, active: true },
  },
  services: {
    key: "services",
    singular: "service",
    plural: "Couture services",
    description: "The garments you stitch to order. Each service has its own page, style options and measurement form.",
    titleField: "name",
    columns: [
      { key: "image", label: "", type: "image" },
      { key: "name", label: "Name" },
      { key: "basePrice", label: "From", type: "money" },
      { key: "leadTimeDays", label: "Days", type: "count" },
      { key: "active", label: "Live", type: "boolean" },
    ],
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "slug", label: "URL slug", type: "text", help: "Leave empty to generate from the name" },
      { name: "tagline", label: "Tagline", type: "text" },
      { name: "description", label: "Description", type: "markdown" },
      { name: "image", label: "Main image", type: "image" },
      { name: "gallery", label: "Gallery", type: "images" },
      { name: "basePrice", label: "Base price", type: "number", width: "half" },
      { name: "leadTimeDays", label: "Lead time (days)", type: "number", width: "half" },
      {
        name: "styleOptions",
        label: "Style options",
        type: "list",
        itemLabel: "option",
        titleKey: "name",
        help: "What the client chooses — lapel, collar, lining… The first choice is the default.",
        fields: [
          { name: "name", label: "Option name", type: "text", placeholder: "Lapel" },
          {
            name: "choices",
            label: "Choices",
            type: "list",
            itemLabel: "choice",
            titleKey: "label",
            fields: [
              { name: "label", label: "Label", type: "text", width: "half", placeholder: "Peak" },
              { name: "priceDelta", label: "Price difference", type: "number", width: "half" },
            ],
          },
        ],
      },
      { name: "measurementFields", label: "Measurements to collect", type: "measurements" },
      { name: "fabricIds", label: "Fabrics offered", type: "fabrics", help: "Select none to offer every active fabric" },
      sort,
      active,
    ],
    defaults: { basePrice: 0, leadTimeDays: 14, gallery: [], styleOptions: [], measurementFields: [], fabricIds: [], sort: 0, active: true },
  },
};

/* ─── Settings forms ───────────────────────────────────────────────────── */

const fontOptions = Object.keys(FONTS).map((name) => ({ value: name, label: name }));

export const GENERAL_FIELDS: Field[] = [
  { name: "_brand", label: "Brand", type: "heading" },
  { name: "storeName", label: "Store name", type: "text", width: "half", required: true, help: "Your brand name. Shown in the header, footer, admin panel, emails and browser tab." },
  { name: "tagline", label: "Tagline", type: "text", width: "half" },
  { name: "logoUrl", label: "Logo", type: "image", help: "Leave empty to show the store name as text. Use a transparent PNG or SVG." },
  { name: "logoHeight", label: "Logo height (px)", type: "number", width: "half" },
  { name: "faviconUrl", label: "Favicon", type: "image", help: "Square PNG, 64px or larger" },
  { name: "_contact", label: "Contact", type: "heading" },
  { name: "email", label: "Email", type: "text", width: "half" },
  { name: "phone", label: "Phone", type: "text", width: "half" },
  { name: "whatsapp", label: "WhatsApp number", type: "text", width: "half", help: "With country code, digits only. Shows a chat button. Leave empty to hide." },
  { name: "hours", label: "Opening hours", type: "text", width: "half" },
  { name: "address", label: "Address", type: "textarea" },
  { name: "_social", label: "Social links", type: "heading" },
  { name: "instagram", label: "Instagram URL", type: "text", width: "half" },
  { name: "facebook", label: "Facebook URL", type: "text", width: "half" },
  { name: "youtube", label: "YouTube URL", type: "text", width: "half" },
  { name: "x", label: "X / Twitter URL", type: "text", width: "half" },
];

export const COMMERCE_FIELDS: Field[] = [
  { name: "_currency", label: "Currency", type: "heading" },
  { name: "currency", label: "Currency code", type: "text", width: "half", help: "ISO code: INR, USD, AED, GBP…" },
  { name: "locale", label: "Number format", type: "text", width: "half", help: "en-IN, en-US, en-GB…" },
  { name: "_shipping", label: "Shipping", type: "heading" },
  { name: "shippingFlat", label: "Flat shipping fee", type: "number", width: "half" },
  { name: "freeShippingAbove", label: "Free shipping above", type: "number", width: "half", help: "0 disables free shipping" },
  { name: "shippingCountries", label: "Countries you deliver to", type: "tags", placeholder: "IN", help: "Two-letter country codes — IN, AE, US, GB… These appear in the checkout country dropdown. Leave empty to offer every country." },
  { name: "deliveryNote", label: "Delivery note", type: "text", help: "Shown on product pages" },
  { name: "returnsNote", label: "Returns note", type: "text", help: "Shown on product pages" },
  { name: "_tax", label: "Tax", type: "heading" },
  { name: "taxRate", label: "Tax rate (%)", type: "number", width: "half", help: "0 hides tax entirely" },
  { name: "taxInclusive", label: "Prices already include tax", type: "boolean", width: "half" },
  { name: "_payments", label: "Payments", type: "heading" },
  { name: "codEnabled", label: "Accept cash on delivery", type: "boolean", width: "half" },
  { name: "onlineEnabled", label: "Accept online payments (Razorpay)", type: "boolean", width: "half", help: "Needs RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your environment" },
  { name: "_orders", label: "Orders & stock", type: "heading" },
  { name: "orderPrefix", label: "Order number prefix", type: "text", width: "half" },
  { name: "lowStockThreshold", label: "Low stock warning at", type: "number", width: "half" },
];

export const SEO_FIELDS: Field[] = [
  { name: "title", label: "Home page title", type: "text", help: "Shown in the browser tab and in search results" },
  { name: "description", label: "Meta description", type: "textarea", help: "Aim for 150 – 160 characters" },
  { name: "ogImage", label: "Social sharing image", type: "image", help: "1200 × 630px. Used when your site is shared on WhatsApp, Instagram, etc." },
];

const linkFields: Field[] = [
  { name: "label", label: "Label", type: "text", width: "half" },
  { name: "href", label: "Link", type: "link", width: "half" },
];

export const NAVIGATION_FIELDS: Field[] = [
  { name: "_announcement", label: "Announcement bar", type: "heading" },
  { name: "announcementEnabled", label: "Show the announcement bar", type: "boolean" },
  {
    name: "announcements",
    label: "Messages",
    type: "list",
    itemLabel: "message",
    titleKey: "text",
    help: "Several messages rotate automatically",
    fields: [
      { name: "text", label: "Text", type: "text", width: "half" },
      { name: "href", label: "Link (optional)", type: "link", width: "half" },
    ],
  },
  { name: "_header", label: "Header menu", type: "heading" },
  {
    name: "header",
    label: "Menu items",
    type: "list",
    itemLabel: "menu item",
    titleKey: "label",
    fields: [
      ...linkFields,
      { name: "children", label: "Dropdown links", type: "list", itemLabel: "link", titleKey: "label", fields: linkFields },
    ],
  },
  { name: "_footer", label: "Footer", type: "heading" },
  { name: "footerAbout", label: "About text", type: "textarea" },
  {
    name: "footerColumns",
    label: "Link columns",
    type: "list",
    itemLabel: "column",
    titleKey: "title",
    fields: [
      { name: "title", label: "Column title", type: "text" },
      { name: "links", label: "Links", type: "list", itemLabel: "link", titleKey: "label", fields: linkFields },
    ],
  },
  { name: "footerBottom", label: "Bottom line", type: "text" },
  { name: "footerNewsletter", label: "Show newsletter signup in the footer", type: "boolean" },
];

export const THEME_TYPOGRAPHY_FIELDS: Field[] = [
  { name: "headingFont", label: "Heading font", type: "select", width: "half", options: fontOptions },
  { name: "bodyFont", label: "Body font", type: "select", width: "half", options: fontOptions },
  {
    name: "headingWeight",
    label: "Heading weight",
    type: "select",
    width: "third",
    options: [
      { value: "400", label: "Regular" },
      { value: "500", label: "Medium" },
      { value: "600", label: "Semibold" },
      { value: "700", label: "Bold" },
    ],
  },
  {
    name: "headingCase",
    label: "Heading case",
    type: "select",
    width: "third",
    options: [
      { value: "normal", label: "As typed" },
      { value: "uppercase", label: "UPPERCASE" },
    ],
  },
  {
    name: "headingTracking",
    label: "Heading spacing",
    type: "select",
    width: "third",
    options: [
      { value: "tight", label: "Tight" },
      { value: "normal", label: "Normal" },
      { value: "wide", label: "Wide" },
    ],
  },
  { name: "baseFontSize", label: "Base text size (px)", type: "number", width: "third", help: "13 – 20" },
];

export const THEME_LAYOUT_FIELDS: Field[] = [
  { name: "_shape", label: "Shape & spacing", type: "heading" },
  { name: "radius", label: "Corner radius (px)", type: "number", width: "third", help: "0 = sharp corners, up to 40" },
  { name: "containerWidth", label: "Page width (px)", type: "number", width: "third", help: "960 – 1920" },
  {
    name: "sectionSpacing",
    label: "Section spacing",
    type: "select",
    width: "third",
    options: [
      { value: "compact", label: "Compact" },
      { value: "comfortable", label: "Comfortable" },
      { value: "spacious", label: "Spacious" },
    ],
  },
  {
    name: "buttonCase",
    label: "Button text",
    type: "select",
    width: "third",
    options: [
      { value: "uppercase", label: "UPPERCASE" },
      { value: "normal", label: "As typed" },
    ],
  },
  { name: "_header", label: "Header", type: "heading" },
  {
    name: "headerLayout",
    label: "Logo position",
    type: "select",
    width: "half",
    options: [
      { value: "left", label: "Logo left, menu centre" },
      { value: "center", label: "Logo centre, menu left" },
    ],
  },
  { name: "headerSticky", label: "Keep header visible while scrolling", type: "boolean", width: "half" },
  { name: "headerSearch", label: "Show search", type: "boolean", width: "half" },
  { name: "headerWishlist", label: "Show wishlist", type: "boolean", width: "half" },
  { name: "_cards", label: "Product cards & grid", type: "heading" },
  {
    name: "cardAspect",
    label: "Image shape",
    type: "select",
    width: "third",
    options: [
      { value: "3/4", label: "Portrait 3:4" },
      { value: "4/5", label: "Portrait 4:5" },
      { value: "1/1", label: "Square" },
    ],
  },
  {
    name: "cardAlign",
    label: "Text alignment",
    type: "select",
    width: "third",
    options: [
      { value: "left", label: "Left" },
      { value: "center", label: "Centre" },
    ],
  },
  {
    name: "gridDesktop",
    label: "Columns on desktop",
    type: "select",
    width: "third",
    options: [
      { value: "3", label: "3" },
      { value: "4", label: "4" },
      { value: "5", label: "5" },
    ],
  },
  {
    name: "gridMobile",
    label: "Columns on mobile",
    type: "select",
    width: "third",
    options: [
      { value: "1", label: "1" },
      { value: "2", label: "2" },
    ],
  },
  { name: "cardQuickAdd", label: "Quick-add sizes on hover", type: "boolean", width: "third" },
  { name: "cardHoverImage", label: "Second image on hover", type: "boolean", width: "third" },
  { name: "cardSwatches", label: "Show colour swatches", type: "boolean", width: "third" },
];

export const THEME_COLOR_FIELDS: { name: string; label: string; help: string }[] = [
  { name: "bg", label: "Background", help: "Page background" },
  { name: "surface", label: "Surface", help: "Soft panels and image placeholders" },
  { name: "fg", label: "Text", help: "Headings and body text" },
  { name: "muted", label: "Muted text", help: "Secondary text" },
  { name: "line", label: "Lines", help: "Borders and dividers" },
  { name: "primary", label: "Buttons", help: "Primary buttons and dark sections" },
  { name: "primaryFg", label: "Button text", help: "Text on primary buttons" },
  { name: "accent", label: "Accent", help: "Eyebrows, sale prices, highlights" },
  { name: "accentFg", label: "Accent text", help: "Text on accent backgrounds" },
  { name: "announceBg", label: "Announcement bar", help: "Top bar background" },
  { name: "announceFg", label: "Announcement text", help: "Top bar text" },
  { name: "footerBg", label: "Footer", help: "Footer background" },
  { name: "footerFg", label: "Footer text", help: "Footer text" },
];
