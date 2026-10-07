import type { Field } from "./fields";
import type { Section, SectionData } from "./types";

export type SectionDefinition = {
  type: string;
  label: string;
  description: string;
  fields: Field[];
  defaults: SectionData;
};

export const FEATURE_ICONS = [
  "truck",
  "scissors",
  "ruler",
  "shield",
  "refresh",
  "gift",
  "sparkles",
  "clock",
  "pin",
  "phone",
  "star",
  "award",
  "package",
  "card",
  "heart",
  "shirt",
] as const;

const heading: Field[] = [
  { name: "eyebrow", label: "Eyebrow", type: "text", width: "half", help: "Small label above the title" },
  { name: "title", label: "Title", type: "text", width: "half" },
  { name: "subtitle", label: "Subtitle", type: "textarea" },
];

const cta: Field[] = [
  { name: "ctaLabel", label: "Button label", type: "text", width: "half" },
  { name: "ctaHref", label: "Button link", type: "link", width: "half" },
];

/** Options every section shares. */
export const COMMON_SECTION_FIELDS: Field[] = [
  { name: "_design", label: "Design", type: "heading" },
  {
    name: "tone",
    label: "Background",
    type: "select",
    width: "half",
    options: [
      { value: "default", label: "Page background" },
      { value: "surface", label: "Soft surface" },
      { value: "dark", label: "Dark (primary colour)" },
      { value: "accent", label: "Accent colour" },
    ],
  },
  {
    name: "spacing",
    label: "Vertical spacing",
    type: "select",
    width: "half",
    options: [
      { value: "default", label: "Theme default" },
      { value: "none", label: "None" },
      { value: "small", label: "Small" },
      { value: "large", label: "Large" },
    ],
  },
];

export const SECTION_DEFINITIONS: SectionDefinition[] = [
  {
    type: "hero",
    label: "Hero banner slider",
    description: "Full-width slideshow of the banners you manage under Banners.",
    fields: [
      {
        name: "placement",
        label: "Banner group",
        type: "placement",
        help: "Shows every active banner whose placement matches this group.",
      },
      {
        name: "height",
        label: "Height",
        type: "select",
        width: "half",
        options: [
          { value: "screen", label: "Full screen" },
          { value: "large", label: "Large" },
          { value: "medium", label: "Medium" },
          { value: "small", label: "Small" },
        ],
      },
      { name: "interval", label: "Seconds per slide", type: "number", width: "half", help: "0 disables autoplay" },
    ],
    defaults: { placement: "home-hero", height: "large", interval: 6, spacing: "none" },
  },
  {
    type: "marquee",
    label: "Scrolling text strip",
    description: "A continuous ticker for short brand messages.",
    fields: [
      {
        name: "items",
        label: "Messages",
        type: "list",
        itemLabel: "message",
        titleKey: "text",
        fields: [{ name: "text", label: "Text", type: "text" }],
      },
      {
        name: "speed",
        label: "Speed",
        type: "select",
        options: [
          { value: "slow", label: "Slow" },
          { value: "normal", label: "Normal" },
          { value: "fast", label: "Fast" },
        ],
      },
    ],
    defaults: {
      items: [{ text: "Ready-to-wear" }, { text: "Made to measure" }, { text: "Bespoke couture" }],
      speed: "normal",
      tone: "dark",
      spacing: "none",
    },
  },
  {
    type: "categories",
    label: "Category tiles",
    description: "Image tiles linking to your product categories.",
    fields: [
      ...heading,
      { name: "limit", label: "How many", type: "number", width: "half" },
      {
        name: "columns",
        label: "Columns on desktop",
        type: "select",
        width: "half",
        options: [
          { value: "3", label: "3" },
          { value: "4", label: "4" },
          { value: "6", label: "6" },
        ],
      },
    ],
    defaults: { eyebrow: "Ready to wear", title: "Shop by category", subtitle: "", limit: 6, columns: "3" },
  },
  {
    type: "products",
    label: "Product collection",
    description: "A grid or carousel of products from a rule or a hand-picked list.",
    fields: [
      ...heading,
      {
        name: "source",
        label: "Which products",
        type: "select",
        width: "half",
        options: [
          { value: "featured", label: "Featured products" },
          { value: "new", label: "New arrivals" },
          { value: "sale", label: "On sale" },
          { value: "all", label: "Latest products" },
          { value: "category", label: "A category" },
          { value: "manual", label: "Hand-picked" },
        ],
      },
      { name: "limit", label: "How many", type: "number", width: "half" },
      { name: "category", label: "Category", type: "category", showIf: { field: "source", equals: "category" } },
      { name: "productIds", label: "Products", type: "products", showIf: { field: "source", equals: "manual" } },
      {
        name: "layout",
        label: "Layout",
        type: "select",
        options: [
          { value: "grid", label: "Grid" },
          { value: "carousel", label: "Horizontal carousel" },
        ],
      },
      ...cta,
    ],
    defaults: {
      eyebrow: "",
      title: "Featured pieces",
      subtitle: "",
      source: "featured",
      limit: 8,
      category: "",
      productIds: [],
      layout: "grid",
      ctaLabel: "View all",
      ctaHref: "/shop",
    },
  },
  {
    type: "split",
    label: "Image with text",
    description: "An editorial block: image on one side, story on the other.",
    fields: [
      { name: "image", label: "Image", type: "image" },
      ...heading.slice(0, 2),
      { name: "body", label: "Text", type: "markdown" },
      ...cta,
      { name: "cta2Label", label: "Second button label", type: "text", width: "half" },
      { name: "cta2Href", label: "Second button link", type: "link", width: "half" },
      {
        name: "imagePosition",
        label: "Image position",
        type: "select",
        width: "half",
        options: [
          { value: "left", label: "Left" },
          { value: "right", label: "Right" },
        ],
      },
      {
        name: "imageAspect",
        label: "Image shape",
        type: "select",
        width: "half",
        options: [
          { value: "4/5", label: "Portrait" },
          { value: "1/1", label: "Square" },
          { value: "4/3", label: "Landscape" },
        ],
      },
    ],
    defaults: {
      image: "",
      eyebrow: "",
      title: "Tell your story",
      body: "",
      ctaLabel: "",
      ctaHref: "",
      cta2Label: "",
      cta2Href: "",
      imagePosition: "left",
      imageAspect: "4/5",
    },
  },
  {
    type: "coutureServices",
    label: "Couture services",
    description: "Cards for the stitching services you offer.",
    fields: [...heading, { name: "limit", label: "How many", type: "number", help: "0 shows all" }, ...cta],
    defaults: {
      eyebrow: "Couture",
      title: "Made for you, and only you",
      subtitle: "",
      limit: 0,
      ctaLabel: "",
      ctaHref: "",
    },
  },
  {
    type: "steps",
    label: "Process steps",
    description: "Numbered steps — ideal for explaining how stitching works.",
    fields: [
      ...heading,
      {
        name: "items",
        label: "Steps",
        type: "list",
        itemLabel: "step",
        titleKey: "title",
        fields: [
          { name: "title", label: "Title", type: "text" },
          { name: "text", label: "Text", type: "textarea" },
        ],
      },
    ],
    defaults: { eyebrow: "", title: "How it works", subtitle: "", items: [] },
  },
  {
    type: "features",
    label: "Feature highlights",
    description: "A row of icons with short promises (shipping, returns, craft…).",
    fields: [
      {
        name: "items",
        label: "Highlights",
        type: "list",
        itemLabel: "highlight",
        titleKey: "title",
        fields: [
          {
            name: "icon",
            label: "Icon",
            type: "select",
            options: FEATURE_ICONS.map((i) => ({ value: i, label: i[0].toUpperCase() + i.slice(1) })),
          },
          { name: "title", label: "Title", type: "text" },
          { name: "text", label: "Text", type: "text" },
        ],
      },
    ],
    defaults: { items: [], tone: "surface", spacing: "small" },
  },
  {
    type: "testimonials",
    label: "Testimonials",
    description: "Quotes from your clients.",
    fields: [
      ...heading.slice(0, 2),
      {
        name: "items",
        label: "Quotes",
        type: "list",
        itemLabel: "quote",
        titleKey: "name",
        fields: [
          { name: "quote", label: "Quote", type: "textarea" },
          { name: "name", label: "Name", type: "text", width: "half" },
          { name: "role", label: "Detail", type: "text", width: "half", placeholder: "Bespoke suit client" },
        ],
      },
    ],
    defaults: { eyebrow: "", title: "In their words", items: [] },
  },
  {
    type: "gallery",
    label: "Lookbook gallery",
    description: "An image grid with optional captions and links.",
    fields: [
      ...heading,
      {
        name: "items",
        label: "Images",
        type: "list",
        itemLabel: "image",
        titleKey: "caption",
        fields: [
          { name: "image", label: "Image", type: "image" },
          { name: "caption", label: "Caption", type: "text", width: "half" },
          { name: "href", label: "Link", type: "link", width: "half" },
        ],
      },
      {
        name: "columns",
        label: "Columns on desktop",
        type: "select",
        options: [
          { value: "2", label: "2" },
          { value: "3", label: "3" },
          { value: "4", label: "4" },
        ],
      },
    ],
    defaults: { eyebrow: "", title: "The lookbook", subtitle: "", items: [], columns: "4" },
  },
  {
    type: "richText",
    label: "Rich text",
    description: "Formatted text written in Markdown — policies, stories, announcements.",
    fields: [
      ...heading.slice(0, 2),
      { name: "body", label: "Content", type: "markdown" },
      {
        name: "align",
        label: "Alignment",
        type: "select",
        width: "half",
        options: [
          { value: "left", label: "Left" },
          { value: "center", label: "Centre" },
        ],
      },
      {
        name: "width",
        label: "Width",
        type: "select",
        width: "half",
        options: [
          { value: "narrow", label: "Narrow" },
          { value: "medium", label: "Medium" },
          { value: "wide", label: "Wide" },
        ],
      },
    ],
    defaults: { eyebrow: "", title: "", body: "", align: "left", width: "narrow" },
  },
  {
    type: "cta",
    label: "Call-to-action banner",
    description: "A bold banner with a background image or colour and a button.",
    fields: [
      { name: "image", label: "Background image", type: "image", help: "Leave empty for a solid colour" },
      ...heading.slice(0, 2),
      { name: "text", label: "Text", type: "textarea" },
      ...cta,
      { name: "overlay", label: "Image darkness (0–90)", type: "number", width: "half" },
      {
        name: "align",
        label: "Alignment",
        type: "select",
        width: "half",
        options: [
          { value: "left", label: "Left" },
          { value: "center", label: "Centre" },
        ],
      },
    ],
    defaults: {
      image: "",
      eyebrow: "",
      title: "Book your fitting",
      text: "",
      ctaLabel: "Get started",
      ctaHref: "/couture",
      overlay: 45,
      align: "center",
      tone: "dark",
    },
  },
  {
    type: "fabrics",
    label: "Fabric swatches",
    description: "Showcases the cloths available for couture orders.",
    fields: [...heading, { name: "limit", label: "How many", type: "number", help: "0 shows all" }],
    defaults: { eyebrow: "The cloth", title: "Fabrics we work with", subtitle: "", limit: 0 },
  },
  {
    type: "faq",
    label: "FAQ",
    description: "Expandable questions and answers.",
    fields: [
      ...heading.slice(0, 2),
      {
        name: "items",
        label: "Questions",
        type: "list",
        itemLabel: "question",
        titleKey: "q",
        fields: [
          { name: "q", label: "Question", type: "text" },
          { name: "a", label: "Answer", type: "textarea" },
        ],
      },
    ],
    defaults: { eyebrow: "", title: "Frequently asked", items: [] },
  },
  {
    type: "newsletter",
    label: "Newsletter signup",
    description: "Collects email subscribers.",
    fields: [
      { name: "title", label: "Title", type: "text" },
      { name: "text", label: "Text", type: "textarea" },
      { name: "buttonLabel", label: "Button label", type: "text" },
    ],
    defaults: {
      title: "Join the list",
      text: "New collections, private fittings and the occasional letter from the workshop.",
      buttonLabel: "Subscribe",
      tone: "surface",
    },
  },
  {
    type: "contact",
    label: "Contact details & form",
    description: "Your store details beside an enquiry form.",
    fields: [
      ...heading.slice(0, 2),
      { name: "text", label: "Text", type: "textarea" },
      { name: "showForm", label: "Show enquiry form", type: "boolean" },
      { name: "mapUrl", label: "Google Maps embed URL", type: "text", help: "Optional. Paste the src of a Google Maps embed." },
    ],
    defaults: { eyebrow: "Visit us", title: "Get in touch", text: "", showForm: true, mapUrl: "" },
  },
];

export function sectionDefinition(type: string) {
  return SECTION_DEFINITIONS.find((d) => d.type === type);
}

export function newSection(type: string, id: string): Section {
  const def = sectionDefinition(type);
  return {
    id,
    type,
    enabled: true,
    data: { tone: "default", spacing: "default", ...structuredClone(def?.defaults ?? {}) },
  };
}
