import bcrypt from "bcryptjs";
import { eq, inArray } from "drizzle-orm";
import { DEFAULT_CONFIG } from "@/lib/defaults";
import type { ColorOption, Section, SectionData, StyleOption } from "@/lib/types";
import { slugify } from "@/lib/utils";
import type { DB } from "./index";
import * as s from "./schema";

const img = (id: string, w = 1200) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

// Placeholder photography (Unsplash). Replace everything from the admin panel.
const P = {
  flatlay: "1593030761757-71fae45fa0e7",
  checkSuit: "1594938298603-c8148c4dae35",
  navySuit: "1617137968427-85924c800a22",
  foldedShirts: "1602810318383-e386cc2a3ccf",
  chambrayShirt: "1596755094514-f87e34085b2c",
  blueShirtTie: "1620012253295-c15cc3e65df4",
  whiteShirtTie: "1598033129183-c4f50c736f10",
  chinos: "1473966968600-fa801b869a1a",
  darkTrousers: "1624378439575-d8705ad7ae80",
  bomber: "1591047139829-d91aecb6caea",
  leatherJacket: "1551028719-00167b16eac5",
  whiteTee: "1521572163474-6864f9cf17ab",
  blackTee: "1583743814966-8936f5b7be1a",
  jeansStack: "1542272604-787c3835535d",
  greyBlazer: "1555069519-127aadedf1ee",
  shirtOnChair: "1558171813-4c088753af8f",
  store: "1441986300917-64674bd600d8",
  darkSuit: "1507679799987-c73779587ccf",
  blackSuit: "1617127365659-c47fa864d8bc",
  tanSuit: "1552374196-1ab2a1c593e8",
  greenSuit: "1593032465175-481ac7f401a0",
  mannequin: "1598808503746-f34c53b9323e",
  whiteShirtsRack: "1603252109303-2751441dd157",
  denimJacket: "1611312449408-fcece27cdbb7",
  teesRack: "1489987707025-afc232f7ea0f",
  rack: "1445205170230-053b83016050",
  leatherJacketMan: "1520975916090-3105956dac38",
  blackTeeLogo: "1618354691373-d851c5c3a990",
  suitTie: "1610652492500-ded49ceeb378",
  beardTee: "1586790170083-2f9ceadc732d",
  jeansWalk: "1541099649105-f69ad21f3246",
  jeansShelf: "1605518216938-7c31b7b14ad0",
  navyBlazer: "1592878904946-b3cd8ae243d0",
  plaidShirt: "1607345366928-199ea26cfe3e",
  polos: "1586363104862-3a5e2ab60d99",
  overcoat: "1539533018447-63fcce2678e3",
};

const sec = (id: string, type: string, data: SectionData): Section => ({
  id,
  type,
  enabled: true,
  data: { tone: "default", spacing: "default", ...data },
});

const md = (...lines: string[]) => lines.join("\n\n");

type SeedProduct = {
  name: string;
  category: string;
  price: number;
  compareAtPrice?: number;
  images: string[];
  sizes: string[];
  colors: ColorOption[];
  description: string;
  fabric: string;
  fit: string;
  tags: string[];
  featured?: boolean;
  isNew?: boolean;
};

const ALPHA = ["S", "M", "L", "XL", "XXL"];
const CHEST = ["38", "40", "42", "44", "46"];
const WAIST = ["30", "32", "34", "36", "38"];
const CARE = "Dry clean recommended. Cool iron on reverse. Store on a shaped hanger.";
const CARE_WASH = "Machine wash cold with like colours. Do not bleach. Line dry in shade.";

const SEED_CATEGORIES = [
  { name: "Shirts", image: P.foldedShirts, description: "From crisp poplin to washed chambray — shirts cut to sit right." },
  { name: "Suits & Blazers", image: P.checkSuit, description: "Half-canvas tailoring in Italian and English cloths." },
  { name: "Trousers", image: P.chinos, description: "Tailored trousers and chinos with a clean, tapered leg." },
  { name: "T-Shirts & Polos", image: P.teesRack, description: "Heavyweight Supima essentials that hold their shape." },
  { name: "Jackets", image: P.leatherJacketMan, description: "Outerwear built to be worn hard and kept for years." },
  { name: "Denim", image: P.jeansShelf, description: "Selvedge and stretch denim, finished by hand." },
];

const SEED_PRODUCTS: SeedProduct[] = [
  {
    name: "Windsor Check Three-Piece Suit",
    category: "Suits & Blazers",
    price: 28999,
    compareAtPrice: 34999,
    images: [P.checkSuit, P.navySuit],
    sizes: CHEST,
    colors: [{ name: "Windsor Blue", hex: "#3c5a8a" }],
    description:
      "A statement three-piece in a soft windowpane check. Half-canvas construction gives the jacket a natural roll through the lapel, while the six-button waistcoat keeps the line clean when the jacket comes off.",
    fabric: "100% Super 110s wool, woven in Biella",
    fit: "Tailored fit — true to size",
    tags: ["suit", "wedding", "formal"],
    featured: true,
  },
  {
    name: "Midnight Navy Two-Piece Suit",
    category: "Suits & Blazers",
    price: 22999,
    images: [P.navySuit, P.navyBlazer],
    sizes: CHEST,
    colors: [
      { name: "Midnight Navy", hex: "#1c2540" },
      { name: "Charcoal", hex: "#3a3c40" },
    ],
    description:
      "The suit every wardrobe is built around. A two-button jacket with notch lapels and softly structured shoulders, paired with flat-front trousers that taper gently to the ankle.",
    fabric: "Wool-rich blend with natural stretch",
    fit: "Slim fit — size up for a relaxed drape",
    tags: ["suit", "office", "formal"],
    featured: true,
    isNew: true,
  },
  {
    name: "Charcoal Signature Suit",
    category: "Suits & Blazers",
    price: 24999,
    images: [P.darkSuit, P.suitTie],
    sizes: CHEST,
    colors: [{ name: "Charcoal", hex: "#2f3136" }],
    description:
      "Our house cut in deep charcoal. Peak lapels, a suppressed waist and a slightly longer jacket length make this the one to reach for when the occasion matters.",
    fabric: "100% merino wool flannel",
    fit: "Tailored fit",
    tags: ["suit", "formal", "evening"],
  },
  {
    name: "Sand Linen Blazer",
    category: "Suits & Blazers",
    price: 12999,
    compareAtPrice: 15999,
    images: [P.tanSuit, P.greyBlazer],
    sizes: CHEST,
    colors: [
      { name: "Sand", hex: "#cdb893" },
      { name: "Stone Grey", hex: "#a7a39b" },
    ],
    description:
      "Unlined and unstructured, this blazer wears like a cardigan and looks like tailoring. Made for warm evenings, destination weddings and everything in between.",
    fabric: "Irish linen & cotton blend",
    fit: "Relaxed fit",
    tags: ["blazer", "summer", "wedding"],
    featured: true,
  },
  {
    name: "Forest Double-Breasted Suit",
    category: "Suits & Blazers",
    price: 26999,
    images: [P.greenSuit],
    sizes: CHEST,
    colors: [{ name: "Forest", hex: "#1e3d31" }],
    description:
      "A confident double-breasted cut in a rich bottle green. Six-on-two buttoning, wide peak lapels and a high-rise trouser.",
    fabric: "Wool & mohair blend",
    fit: "Tailored fit",
    tags: ["suit", "evening", "statement"],
    isNew: true,
  },
  {
    name: "Washed Chambray Shirt",
    category: "Shirts",
    price: 2799,
    images: [P.chambrayShirt, P.shirtOnChair],
    sizes: ALPHA,
    colors: [
      { name: "Indigo", hex: "#5c7ea3" },
      { name: "Light Wash", hex: "#b9cde0" },
    ],
    description:
      "Garment-washed for a lived-in handle from the first wear. A soft button-down collar and a single chest pocket keep it easy to dress up or down.",
    fabric: "100% cotton chambray",
    fit: "Regular fit",
    tags: ["shirt", "casual", "weekend"],
    featured: true,
  },
  {
    name: "Classic White Poplin Shirt",
    category: "Shirts",
    price: 2499,
    images: [P.whiteShirtTie, P.whiteShirtsRack],
    sizes: ALPHA,
    colors: [{ name: "Optic White", hex: "#f7f6f2" }],
    description:
      "The white shirt, done properly. Two-ply poplin with a crisp semi-spread collar, mother-of-pearl buttons and single-needle seams throughout.",
    fabric: "Two-ply Egyptian cotton poplin",
    fit: "Slim fit",
    tags: ["shirt", "formal", "office"],
    featured: true,
  },
  {
    name: "Sky Twill Formal Shirt",
    category: "Shirts",
    price: 2699,
    images: [P.blueShirtTie, P.foldedShirts],
    sizes: ALPHA,
    colors: [
      { name: "Sky Blue", hex: "#a9c4e2" },
      { name: "Burgundy", hex: "#6b2233" },
    ],
    description:
      "A fine twill with a subtle sheen that holds a tie beautifully. Cut with a higher armhole for a cleaner line under a jacket.",
    fabric: "Cotton twill, wrinkle-resistant finish",
    fit: "Tailored fit",
    tags: ["shirt", "formal", "office"],
    isNew: true,
  },
  {
    name: "Heritage Check Overshirt",
    category: "Shirts",
    price: 3499,
    compareAtPrice: 4299,
    images: [P.plaidShirt],
    sizes: ALPHA,
    colors: [{ name: "Ochre Check", hex: "#b38a3d" }],
    description:
      "Brushed on both sides and heavy enough to wear as a light jacket. Twin flap pockets, corozo buttons and a straight hem.",
    fabric: "Brushed cotton flannel, 280 gsm",
    fit: "Relaxed fit",
    tags: ["shirt", "overshirt", "winter"],
  },
  {
    name: "Tailored Stretch Chinos",
    category: "Trousers",
    price: 2999,
    images: [P.chinos],
    sizes: WAIST,
    colors: [
      { name: "Khaki", hex: "#b59d77" },
      { name: "Navy", hex: "#232c44" },
      { name: "Olive", hex: "#5a5f43" },
    ],
    description:
      "A sharper chino. Mid-rise with a tapered leg, a curved waistband that sits flat, and just enough stretch to move with you.",
    fabric: "Cotton twill with 2% elastane",
    fit: "Slim tapered fit",
    tags: ["trousers", "chinos", "casual"],
    featured: true,
  },
  {
    name: "Wool-Blend Formal Trousers",
    category: "Trousers",
    price: 3999,
    images: [P.darkTrousers],
    sizes: WAIST,
    colors: [
      { name: "Charcoal", hex: "#34363a" },
      { name: "Black", hex: "#141414" },
    ],
    description:
      "Pressed creases, side adjusters and an extended tab closure. Half-lined to the knee so they drape cleanly all day.",
    fabric: "Wool & polyester suiting",
    fit: "Tailored fit",
    tags: ["trousers", "formal", "office"],
  },
  {
    name: "Essential Supima Tee",
    category: "T-Shirts & Polos",
    price: 1299,
    images: [P.whiteTee, P.beardTee, P.blackTee],
    sizes: ALPHA,
    colors: [
      { name: "White", hex: "#f5f4f0" },
      { name: "Black", hex: "#121212" },
    ],
    description:
      "A heavyweight tee with a tight, bound collar that will not bacon. Pre-shrunk, side-seamed and cut slightly boxy.",
    fabric: "100% Supima cotton, 220 gsm",
    fit: "Regular fit",
    tags: ["tee", "essential", "casual"],
    featured: true,
  },
  {
    name: "Signature Logo Tee",
    category: "T-Shirts & Polos",
    price: 1499,
    images: [P.blackTeeLogo, P.blackTee],
    sizes: ALPHA,
    colors: [{ name: "Black", hex: "#121212" }],
    description: "Our essential tee with a small tonal embroidery at the chest. Understated by design.",
    fabric: "100% Supima cotton, 220 gsm",
    fit: "Regular fit",
    tags: ["tee", "casual"],
    isNew: true,
  },
  {
    name: "Piqué Polo",
    category: "T-Shirts & Polos",
    price: 1899,
    compareAtPrice: 2299,
    images: [P.polos],
    sizes: ALPHA,
    colors: [
      { name: "Coral", hex: "#e2675a" },
      { name: "Emerald", hex: "#2f8f6b" },
    ],
    description:
      "A proper piqué polo with a self-fabric collar that keeps its shape, a two-button placket and split side vents.",
    fabric: "Cotton piqué",
    fit: "Regular fit",
    tags: ["polo", "summer", "casual"],
  },
  {
    name: "Black Leather Biker Jacket",
    category: "Jackets",
    price: 18999,
    images: [P.leatherJacketMan, P.leatherJacket],
    sizes: ALPHA,
    colors: [{ name: "Black", hex: "#111111" }],
    description:
      "Full-grain lambskin that softens with every wear. Asymmetric zip, belted hem and quilted satin lining.",
    fabric: "Full-grain lambskin leather",
    fit: "Slim fit — designed to sit close",
    tags: ["jacket", "leather", "winter"],
    featured: true,
  },
  {
    name: "Rust Bomber Jacket",
    category: "Jackets",
    price: 6999,
    compareAtPrice: 8499,
    images: [P.bomber],
    sizes: ALPHA,
    colors: [{ name: "Rust", hex: "#b4613d" }],
    description: "A lightweight bomber in a matte technical satin. Ribbed trims, a two-way zip and an inner phone pocket.",
    fabric: "Recycled nylon satin",
    fit: "Regular fit",
    tags: ["jacket", "bomber", "transitional"],
    isNew: true,
  },
  {
    name: "Indigo Denim Trucker Jacket",
    category: "Jackets",
    price: 5499,
    images: [P.denimJacket],
    sizes: ALPHA,
    colors: [{ name: "Indigo", hex: "#2c4468" }],
    description: "A classic trucker with a corduroy collar. Rigid 13oz denim that breaks in and fades to your shape.",
    fabric: "13oz cotton denim",
    fit: "Regular fit",
    tags: ["jacket", "denim"],
  },
  {
    name: "Wool Overcoat",
    category: "Jackets",
    price: 16999,
    images: [P.overcoat],
    sizes: ALPHA,
    colors: [{ name: "Camel", hex: "#b8926a" }],
    description: "A single-breasted overcoat cut to layer over tailoring. Notch lapels, flap pockets and a centre vent.",
    fabric: "Wool & cashmere blend",
    fit: "Relaxed fit",
    tags: ["coat", "winter", "formal"],
  },
  {
    name: "Selvedge Slim Jeans",
    category: "Denim",
    price: 4499,
    images: [P.jeansStack, P.jeansWalk],
    sizes: WAIST,
    colors: [
      { name: "Raw Indigo", hex: "#1f2b45" },
      { name: "Washed Black", hex: "#2b2b2d" },
    ],
    description:
      "Woven on vintage shuttle looms and finished with a chain-stitched hem. Slim through the thigh with a gentle taper.",
    fabric: "14oz selvedge denim",
    fit: "Slim tapered fit",
    tags: ["jeans", "denim", "casual"],
    featured: true,
  },
];

// ─── Couture: men's suits and formal tailoring ──────────────────────────────

/** `use` lists the kinds of garment each cloth is offered for. */
const SEED_FABRICS = [
  // Suiting
  { name: "Italian Wool — Midnight Navy", material: "Super 110s worsted wool", hex: "#1f2a44", priceDelta: 0, use: "suit dinner jacket trouser" },
  { name: "Worsted Wool — Charcoal", material: "Super 100s worsted wool", hex: "#3a3d42", priceDelta: 0, use: "suit jacket trouser" },
  { name: "Worsted Wool — Light Grey", material: "Super 100s worsted wool", hex: "#9b9ea4", priceDelta: 0, use: "suit jacket trouser" },
  { name: "Super 120s Wool — Jet Black", material: "Super 120s worsted wool", hex: "#121212", priceDelta: 2500, use: "suit dinner trouser" },
  { name: "Wool Flannel — Mid Grey", material: "Merino wool flannel", hex: "#6c6f75", priceDelta: 1500, use: "suit jacket trouser" },
  { name: "Chalk Stripe — Navy", material: "Wool with a soft chalk stripe", hex: "#232b45", priceDelta: 2000, use: "suit" },
  { name: "Glen Check — Grey", material: "Wool Prince of Wales check", hex: "#7d8087", priceDelta: 2000, use: "suit jacket" },
  { name: "Terry Wool — Royal Blue", material: "Wool-rich suiting blend", hex: "#24408e", priceDelta: 0, use: "suit jacket trouser" },
  { name: "Donegal Tweed — Peat Brown", material: "Pure new wool tweed", hex: "#6a543f", priceDelta: 2000, use: "jacket" },
  { name: "Irish Linen — Sand", material: "Pure linen suiting", hex: "#d2c1a3", priceDelta: 500, use: "suit jacket trouser" },
  { name: "Barathea — Black", material: "Wool barathea for evening wear", hex: "#0c0c0e", priceDelta: 3500, use: "dinner" },
  { name: "Cotton Twill — Khaki", material: "Stretch cotton twill", hex: "#b59d77", priceDelta: 0, use: "trouser" },
  // Shirting
  { name: "Egyptian Cotton Poplin — White", material: "Two-ply cotton poplin", hex: "#f4f2ee", priceDelta: 0, use: "shirt" },
  { name: "Oxford — Sky Blue", material: "Cotton oxford", hex: "#a9c0dd", priceDelta: 0, use: "shirt" },
  { name: "Cotton Twill — Pale Pink", material: "Fine cotton twill", hex: "#ecc9cf", priceDelta: 0, use: "shirt" },
  { name: "Bengal Stripe — Blue", material: "Yarn-dyed cotton stripe", hex: "#8fa9d6", priceDelta: 200, use: "shirt" },
  { name: "Linen — Off White", material: "Pure linen shirting", hex: "#ece7da", priceDelta: 400, use: "shirt" },
  { name: "Chambray — Indigo", material: "Cotton chambray", hex: "#6f8fb0", priceDelta: 200, use: "shirt" },
];

type SeedService = {
  name: string;
  tagline: string;
  description: string;
  image: string;
  gallery: string[];
  basePrice: number;
  leadTimeDays: number;
  measurementFields: string[];
  styleOptions: StyleOption[];
  /** Which fabrics are offered: matches the `use` of SEED_FABRICS. */
  use: string;
};

const opt = (name: string, ...choices: [string, number][]): StyleOption => ({
  name,
  choices: choices.map(([label, priceDelta]) => ({ label, priceDelta })),
});

const UPPER = ["neck", "shoulder", "chest", "stomach", "sleeve", "bicep", "wrist"];
const LOWER = ["trouserWaist", "hip", "thigh", "rise", "inseam", "trouserLength", "ankle"];

// Options shared by every garment that includes a jacket or trousers.
const JACKET_OPTIONS = [
  opt("Jacket front", ["Single-breasted, two button", 0], ["Single-breasted, three button", 0], ["Double-breasted", 2000]),
  opt("Lapel", ["Notch lapel", 0], ["Peak lapel", 0]),
  opt("Jacket pockets", ["Flap pockets", 0], ["Jetted pockets", 0], ["Patch pockets", 0]),
  opt("Vents", ["Double vent", 0], ["Single vent", 0], ["No vent", 0]),
  opt("Jacket lining", ["Half lined", 0], ["Fully lined", 1500]),
];
const TROUSER_OPTIONS = [
  opt("Trouser front", ["Flat front", 0], ["Single pleat", 0], ["Double pleat", 0]),
  opt("Trouser fit", ["Slim", 0], ["Tapered", 0], ["Straight", 0]),
  opt("Trouser waistband", ["Belt loops", 0], ["Side adjusters", 400]),
  opt("Trouser hem", ["Plain hem", 0], ["Turn-ups", 200]),
];
const MONOGRAM = opt("Monogram", ["None", 0], ["Inside jacket pocket", 500]);

const SEED_SERVICES: SeedService[] = [
  {
    name: "Two-Piece Suit",
    tagline: "Jacket and trousers, cut from a pattern drafted only for you",
    description: md(
      "Every suit begins with a paper pattern drafted from your measurements. We cut the cloth by hand, baste it together for your first fitting, and refine the balance, the pitch of the sleeve and the line of the trouser until it sits exactly as it should.",
      "Choose your cloth, lapel, pockets and trouser style — or leave the details to our cutters.",
    ),
    image: P.navySuit,
    gallery: [P.darkSuit, P.mannequin, P.suitTie],
    basePrice: 21999,
    leadTimeDays: 21,
    measurementFields: [...UPPER, "jacketLength", ...LOWER, "height"],
    styleOptions: [...JACKET_OPTIONS, ...TROUSER_OPTIONS, MONOGRAM],
    use: "suit",
  },
  {
    name: "Three-Piece Suit",
    tagline: "Jacket, waistcoat and trousers for weddings and occasions",
    description: md(
      "The complete suit. A matching waistcoat sharpens the silhouette and keeps the look together when the jacket comes off — which is why it remains the first choice for grooms.",
      "All three pieces are cut from one length of cloth so the shade and pattern match exactly.",
    ),
    image: P.checkSuit,
    gallery: [P.navySuit, P.suitTie, P.mannequin],
    basePrice: 26999,
    leadTimeDays: 24,
    measurementFields: [...UPPER, "jacketLength", "waistcoatLength", ...LOWER, "height"],
    styleOptions: [
      ...JACKET_OPTIONS,
      opt("Waistcoat front", ["Single-breasted, five button", 0], ["Single-breasted with lapels", 800], ["Double-breasted", 1200]),
      opt("Waistcoat back", ["Lining cloth with adjuster", 0], ["Matching suit cloth", 600]),
      ...TROUSER_OPTIONS,
      MONOGRAM,
    ],
    use: "suit",
  },
  {
    name: "Tuxedo",
    tagline: "A dinner suit with satin lapels for black-tie evenings",
    description: md(
      "Cut in black or midnight wool with silk-satin facings on the lapels, covered buttons and a satin stripe down the trouser seam.",
      "We can also make the dress shirt and a cummerbund or low-cut waistcoat to complete it.",
    ),
    image: P.blackSuit,
    gallery: [P.darkSuit, P.suitTie],
    basePrice: 29999,
    leadTimeDays: 24,
    measurementFields: [...UPPER, "jacketLength", ...LOWER, "height"],
    styleOptions: [
      opt("Jacket front", ["Single-breasted, one button", 0], ["Double-breasted", 2000]),
      opt("Satin lapel", ["Peak lapel", 0], ["Shawl lapel", 0]),
      opt("Vents", ["No vent", 0], ["Double vent", 0]),
      opt("Trouser front", ["Flat front", 0], ["Single pleat", 0]),
      opt("Trouser waistband", ["Side adjusters", 0], ["Belt loops", 0]),
      opt("Waist covering", ["None", 0], ["Cummerbund", 1200], ["Low-cut waistcoat", 3500]),
      MONOGRAM,
    ],
    use: "dinner",
  },
  {
    name: "Blazer",
    tagline: "A tailored jacket to wear with trousers, chinos or denim",
    description: md(
      "Softer and more versatile than a suit jacket. Have it fully structured for the office, or unlined and unpadded so it wears like a cardigan.",
    ),
    image: P.tanSuit,
    gallery: [P.greyBlazer, P.navyBlazer],
    basePrice: 13999,
    leadTimeDays: 16,
    measurementFields: [...UPPER, "jacketLength", "height"],
    styleOptions: [
      opt("Jacket front", ["Single-breasted, two button", 0], ["Double-breasted", 1500]),
      opt("Lapel", ["Notch lapel", 0], ["Peak lapel", 0]),
      opt("Pockets", ["Patch pockets", 0], ["Flap pockets", 0]),
      opt("Buttons", ["Horn", 0], ["Brass", 600], ["Mother of pearl", 900]),
      opt("Lining", ["Unlined", 0], ["Half lined", 0], ["Fully lined", 1200]),
      opt("Elbow patches", ["None", 0], ["Suede patches", 800]),
    ],
    use: "jacket",
  },
  {
    name: "Jodhpuri Suit",
    tagline: "The bandhgala — a closed-collar jacket with matching trousers",
    description: md(
      "A stand collar, a clean buttoned front and a strong shoulder. Cut in suiting wool, it is the sharpest thing you can wear to a reception.",
    ),
    image: P.navyBlazer,
    gallery: [P.greenSuit, P.navySuit],
    basePrice: 23999,
    leadTimeDays: 21,
    measurementFields: [...UPPER, "jacketLength", ...LOWER, "height"],
    styleOptions: [
      opt("Set", ["Jacket with trousers", 0], ["Jacket only", -5000]),
      opt("Buttons", ["Covered in suit cloth", 0], ["Antique metal", 600], ["Mother of pearl", 900]),
      opt("Vents", ["Double vent", 0], ["Single vent", 0]),
      opt("Jacket lining", ["Half lined", 0], ["Fully lined", 1500]),
      opt("Trouser front", ["Flat front", 0], ["Single pleat", 0]),
      opt("Trouser fit", ["Slim", 0], ["Tapered", 0], ["Straight", 0]),
    ],
    use: "suit",
  },
  {
    name: "Formal Shirt",
    tagline: "Your collar, your cuff, your exact sleeve length",
    description: md(
      "Once we have your measurements on file, ordering a shirt takes two minutes. Pick a cloth, choose a collar and cuff, and we will cut it to your pattern.",
      "Reorders are quicker still — and we keep your pattern updated as your preferences change.",
    ),
    image: P.whiteShirtsRack,
    gallery: [P.foldedShirts, P.whiteShirtTie],
    basePrice: 2499,
    leadTimeDays: 10,
    measurementFields: [...UPPER, "shirtLength"],
    styleOptions: [
      opt("Collar", ["Semi-spread", 0], ["Cutaway", 0], ["Button-down", 0], ["Wing collar (for a tuxedo)", 200]),
      opt("Cuff", ["Single button", 0], ["Double button", 0], ["French cuff", 300]),
      opt("Fit", ["Slim", 0], ["Tailored", 0], ["Classic", 0]),
      opt("Placket", ["Standard", 0], ["Concealed", 150]),
      opt("Chest pocket", ["No pocket", 0], ["One pocket", 0]),
      opt("Monogram", ["None", 0], ["On the cuff", 250], ["On the chest", 250]),
    ],
    use: "shirt",
  },
  {
    name: "Formal Trousers",
    tagline: "Cut to your rise, seat and break",
    description: md(
      "Off-the-rack trousers fit almost nobody properly. Ours are drafted from your measurements with the rise, seat and hem you actually want.",
    ),
    image: P.darkTrousers,
    gallery: [P.chinos],
    basePrice: 3499,
    leadTimeDays: 10,
    measurementFields: LOWER,
    styleOptions: [
      ...TROUSER_OPTIONS,
      opt("Back pockets", ["Two pockets", 0], ["One pocket", 0], ["No pockets", 0]),
    ],
    use: "trouser",
  },
  {
    name: "Waistcoat",
    tagline: "To complete a suit you own, or to wear on its own",
    description: md(
      "Bring the suit it needs to match, or choose a contrasting cloth. Cut to finish just over the waistband so no shirt shows in between.",
    ),
    image: P.suitTie,
    gallery: [P.checkSuit],
    basePrice: 5999,
    leadTimeDays: 12,
    measurementFields: ["neck", "shoulder", "chest", "stomach", "waistcoatLength"],
    styleOptions: [
      opt("Front", ["Single-breasted, five button", 0], ["Double-breasted", 800]),
      opt("Lapel", ["No lapel", 0], ["Notch lapel", 500], ["Shawl lapel", 500]),
      opt("Pockets", ["Two welt pockets", 0], ["Four welt pockets", 300]),
      opt("Back", ["Lining cloth with adjuster", 0], ["Matching cloth", 600]),
    ],
    use: "suit",
  },
];

const PROCESS_STEPS = [
  { title: "Choose your garment & cloth", text: "Pick a service, browse our fabrics and select the details — lapel, collar, lining, buttons." },
  { title: "Share your measurements", text: "Enter them online with our guide, visit the studio, or book a tailor to come to you." },
  { title: "Trial fitting", text: "We baste the garment together and refine the fit on you before the final stitching." },
  { title: "Delivered, pressed and ready", text: "Collect from the studio or have it delivered. Alterations are on us for 30 days." },
];

const TESTIMONIALS = [
  { quote: "I have had suits made in London and Milan. This is the first one I did not need to send back for a single alteration.", name: "Arjun Mehta", role: "Two-piece suit" },
  { quote: "They took my measurements at home, sent photos of the cloth options, and my three-piece suit arrived a week before the wedding. Flawless.", name: "Rohan Kapoor", role: "Three-piece suit" },
  { quote: "The shirts are the best value in my wardrobe. I reorder every season and they fit exactly the same every time.", name: "Vikram Nair", role: "Formal shirts" },
];

const FEATURES = [
  { icon: "truck", title: "Free shipping", text: "On orders above ₹2,999" },
  { icon: "scissors", title: "Master tailors", text: "Cut and stitched in-house" },
  { icon: "refresh", title: "Easy returns", text: "7 days on ready-to-wear" },
  { icon: "shield", title: "Secure checkout", text: "UPI, cards or cash on delivery" },
];

function buildPages() {
  const home: Section[] = [
    sec("home-hero", "hero", { placement: "home-hero", height: "large", interval: 6, spacing: "none" }),
    sec("home-features", "features", { items: FEATURES, tone: "surface", spacing: "small" }),
    sec("home-categories", "categories", {
      eyebrow: "Ready to wear",
      title: "Shop by category",
      subtitle: "Considered essentials, in stock and ready to ship.",
      limit: 6,
      columns: "3",
    }),
    sec("home-featured", "products", {
      eyebrow: "The edit",
      title: "Pieces we keep coming back to",
      subtitle: "",
      source: "featured",
      limit: 8,
      layout: "grid",
      ctaLabel: "Shop everything",
      ctaHref: "/shop",
      category: "",
      productIds: [],
    }),
    sec("home-couture", "split", {
      image: img(P.mannequin, 1400),
      eyebrow: "The couture house",
      title: "Stitched for one person. You.",
      body: md(
        "Beyond the rail, our workshop cuts suits, tuxedos, blazers and shirts to individual measurements — one garment, one pattern, one client at a time.",
        "Choose your cloth, share your measurements online or at a fitting, and we will handle the rest.",
      ),
      ctaLabel: "Explore couture",
      ctaHref: "/couture",
      cta2Label: "Book a fitting",
      cta2Href: "/couture/two-piece-suit",
      imagePosition: "left",
      imageAspect: "4/5",
      tone: "surface",
    }),
    sec("home-new", "products", {
      eyebrow: "Just in",
      title: "New arrivals",
      subtitle: "",
      source: "new",
      limit: 8,
      layout: "carousel",
      ctaLabel: "See all new arrivals",
      ctaHref: "/shop?sort=newest",
      category: "",
      productIds: [],
    }),
    sec("home-marquee", "marquee", {
      items: [{ text: "Ready-to-wear" }, { text: "Made to measure" }, { text: "Bespoke couture" }, { text: "Wedding suits" }],
      speed: "normal",
      tone: "dark",
      spacing: "none",
    }),
    sec("home-testimonials", "testimonials", { eyebrow: "Clients", title: "In their words", items: TESTIMONIALS }),
    sec("home-gallery", "gallery", {
      eyebrow: "Lookbook",
      title: "How it is worn",
      subtitle: "",
      columns: "4",
      items: [
        { image: img(P.navySuit, 900), caption: "The navy two-piece", href: "/product/midnight-navy-two-piece-suit" },
        { image: img(P.tanSuit, 900), caption: "Linen, undone", href: "/product/sand-linen-blazer" },
        { image: img(P.leatherJacketMan, 900), caption: "The biker", href: "/product/black-leather-biker-jacket" },
        { image: img(P.flatlay, 900), caption: "Weekend uniform", href: "/shop" },
      ],
    }),
    sec("home-newsletter", "newsletter", {
      title: "Join the list",
      text: "New collections, private fittings and the occasional letter from the workshop.",
      buttonLabel: "Subscribe",
      tone: "surface",
    }),
  ];

  const couture: Section[] = [
    sec("couture-hero", "hero", { placement: "couture-hero", height: "medium", interval: 0, spacing: "none" }),
    sec("couture-intro", "richText", {
      eyebrow: "Couture & stitching",
      title: "A garment that exists because you asked for it",
      body: "Ready-to-wear is designed for many. Couture is made for one. Tell us what you need — a three-piece suit for the wedding, a navy two-piece for the boardroom, a dozen shirts that finally fit — and our cutters will draft a pattern that belongs to you alone.",
      align: "center",
      width: "medium",
    }),
    sec("couture-services", "coutureServices", {
      eyebrow: "What we make",
      title: "Choose your garment",
      subtitle: "Every service includes a personal pattern, a trial fitting and 30 days of complimentary alterations.",
      limit: 0,
      ctaLabel: "",
      ctaHref: "",
    }),
    sec("couture-steps", "steps", {
      eyebrow: "The process",
      title: "From first measure to final press",
      subtitle: "",
      items: PROCESS_STEPS,
      tone: "surface",
    }),
    sec("couture-fabrics", "fabrics", {
      eyebrow: "The cloth",
      title: "Fabrics we work with",
      subtitle: "Mill-sourced wools, Irish linens and long-staple cottons. Bring your own cloth if you prefer.",
      limit: 0,
    }),
    sec("couture-faq", "faq", {
      eyebrow: "Good to know",
      title: "Frequently asked",
      items: [
        { q: "How long does a couture order take?", a: "Shirts and trousers take around 10 days. Suits take about three weeks and tuxedos a little longer. Rush orders are possible — ask us." },
        { q: "Do I have to visit the studio?", a: "No. You can enter measurements online using our guide, send us a garment that fits you well, or book a tailor to visit your home." },
        { q: "When do I pay?", a: "We confirm your order and the final price first. An advance is taken at confirmation and the balance on delivery." },
        { q: "What if it does not fit?", a: "Every order includes a trial fitting, and alterations are complimentary for 30 days after delivery." },
        { q: "Can I bring my own fabric?", a: "Yes. Mention it in the notes when you place your request and we will quote for stitching only." },
      ],
    }),
    sec("couture-cta", "cta", {
      image: img(P.store, 1920),
      eyebrow: "Prefer to talk it through?",
      title: "Book a private consultation",
      text: "Thirty minutes with a cutter, in person or on a video call. No obligation.",
      ctaLabel: "Contact the studio",
      ctaHref: "/contact",
      overlay: 55,
      align: "center",
      tone: "dark",
      spacing: "none",
    }),
  ];

  const about: Section[] = [
    sec("about-story", "split", {
      image: img(P.store, 1400),
      eyebrow: "Our story",
      title: "Two crafts under one roof",
      body: md(
        "We started as a single cutting table and a belief that men deserve clothes that fit — whether they come off the rail or off the bolt.",
        "Today the house does both. A ready-to-wear line of essentials designed in our studio, and a couture workshop where every garment is drafted, cut and stitched for one client.",
      ),
      ctaLabel: "Shop ready-to-wear",
      ctaHref: "/shop",
      cta2Label: "Discover couture",
      cta2Href: "/couture",
      imagePosition: "right",
      imageAspect: "4/3",
    }),
    sec("about-features", "features", { items: FEATURES, tone: "surface", spacing: "small" }),
    sec("about-text", "richText", {
      eyebrow: "What we believe",
      title: "Fewer, better, longer",
      body: md(
        "- **Cloth first.** We buy from mills we have visited and weavers we know by name.",
        "- **Made here.** Our workshop is upstairs from the store. You are welcome to see it.",
        "- **Built to be altered.** Generous seam allowances mean your clothes can change as you do.",
      ),
      align: "left",
      width: "narrow",
    }),
    sec("about-testimonials", "testimonials", { eyebrow: "Clients", title: "In their words", items: TESTIMONIALS, tone: "surface" }),
  ];

  const contact: Section[] = [
    sec("contact-main", "contact", {
      eyebrow: "Visit us",
      title: "Get in touch",
      text: "Questions about an order, a fitting or a fabric? Write to us and a real person will reply within a working day.",
      showForm: true,
      mapUrl: "",
    }),
  ];

  const policy = (id: string, title: string, body: string): Section[] => [
    sec(id, "richText", { eyebrow: "", title, body, align: "left", width: "narrow" }),
  ];

  return [
    { slug: "home", title: "Home", sections: home, system: true },
    { slug: "couture", title: "Couture", sections: couture, system: true },
    { slug: "about", title: "Our Story", sections: about, system: false },
    { slug: "contact", title: "Contact", sections: contact, system: false },
    {
      slug: "size-guide",
      title: "Size Guide",
      system: false,
      sections: policy(
        "size-guide-body",
        "Size Guide",
        md(
          "Measurements are of the body, in inches. If you are between sizes, size up for a relaxed fit — or have the piece [stitched to your measurements](/couture).",
          "## Shirts, tees & jackets",
          [
            "| Size | Chest | Shoulder | Sleeve |",
            "| --- | --- | --- | --- |",
            "| S | 36 – 38 | 17 | 24.5 |",
            "| M | 38 – 40 | 17.5 | 25 |",
            "| L | 40 – 42 | 18 | 25.5 |",
            "| XL | 42 – 44 | 18.5 | 26 |",
            "| XXL | 44 – 46 | 19 | 26.5 |",
          ].join("\n"),
          "## Suits & blazers",
          [
            "| Size | Chest | Waist | Jacket length |",
            "| --- | --- | --- | --- |",
            "| 38 | 38 | 32 | 28.5 |",
            "| 40 | 40 | 34 | 29 |",
            "| 42 | 42 | 36 | 29.5 |",
            "| 44 | 44 | 38 | 30 |",
            "| 46 | 46 | 40 | 30.5 |",
          ].join("\n"),
          "## Trousers & denim",
          [
            "| Size | Waist | Hip | Inseam |",
            "| --- | --- | --- | --- |",
            "| 30 | 30 | 37 | 31 |",
            "| 32 | 32 | 39 | 31.5 |",
            "| 34 | 34 | 41 | 32 |",
            "| 36 | 36 | 43 | 32 |",
            "| 38 | 38 | 45 | 32.5 |",
          ].join("\n"),
          "## How to measure",
          [
            "- **Chest:** around the fullest part, tape level under the arms.",
            "- **Waist:** where you normally wear your trousers.",
            "- **Sleeve:** from the shoulder point to the wrist bone.",
          ].join("\n"),
        ),
      ),
    },
    {
      slug: "shipping-returns",
      title: "Shipping & Returns",
      system: false,
      sections: policy(
        "shipping-body",
        "Shipping & Returns",
        md(
          "## Shipping",
          "Ready-to-wear orders are dispatched within 24 hours and delivered in 3 – 6 business days. Shipping is free above ₹2,999.",
          "## Returns & exchanges",
          "Unworn ready-to-wear items can be returned or exchanged within 7 days of delivery. Write to us with your order number and we will arrange a pickup.",
          "## Couture orders",
          "Made-to-order garments cannot be returned, but alterations are complimentary for 30 days after delivery.",
        ),
      ),
    },
    {
      slug: "privacy",
      title: "Privacy Policy",
      system: false,
      sections: policy(
        "privacy-body",
        "Privacy Policy",
        md(
          "We collect only the information needed to fulfil your orders: your name, contact details, delivery address and, for couture orders, your measurements.",
          "We never sell your data. Payment details are handled by our payment partner and never touch our servers.",
          "To have your data removed, write to us and we will delete it within 7 days.",
        ),
      ),
    },
    {
      slug: "terms",
      title: "Terms of Service",
      system: false,
      sections: policy(
        "terms-body",
        "Terms of Service",
        md(
          "By placing an order you agree to the prices, delivery timelines and return policy shown at checkout.",
          "Couture orders are confirmed only after we have reviewed your request and shared a final quote.",
          "Replace this page with your own terms from the admin panel.",
        ),
      ),
    },
  ];
}

/** Creates the first admin account from ADMIN_EMAIL / ADMIN_PASSWORD when no admin exists yet. */
export async function ensureAdmin(db: DB) {
  const existing = await db.select({ id: s.users.id }).from(s.users).where(eq(s.users.role, "admin")).limit(1);
  if (existing.length > 0) return;

  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.warn("[setup] No admin account exists. Set ADMIN_EMAIL and ADMIN_PASSWORD, then run `npm run db:setup`.");
    return;
  }
  if (password.length < 8) {
    console.warn("[setup] ADMIN_PASSWORD must be at least 8 characters. Admin account was not created.");
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db.select().from(s.users).where(eq(s.users.email, email)).limit(1);
  if (user) {
    await db.update(s.users).set({ role: "admin", passwordHash }).where(eq(s.users.id, user.id));
  } else {
    await db.insert(s.users).values({ name: "Store Admin", email, passwordHash, role: "admin" });
  }
  console.log(`[setup] Admin account ready: ${email}`);
}

type Tx = Parameters<Parameters<DB["transaction"]>[0]>[0];
type Conn = DB | Tx;

/** Adds the couture fabrics and services, skipping any that already exist. */
async function insertCoutureCatalogue(db: Conn) {
  const present = new Set((await db.select({ name: s.fabrics.name }).from(s.fabrics)).map((f) => f.name));
  const missing = SEED_FABRICS.map(({ use: _use, ...fabric }, sort) => ({ ...fabric, sort })).filter((f) => !present.has(f.name));
  if (missing.length > 0) await db.insert(s.fabrics).values(missing);

  const fabricRows = await db.select({ id: s.fabrics.id, name: s.fabrics.name }).from(s.fabrics);
  const fabricsFor = (use: string) =>
    fabricRows
      .filter((row) => SEED_FABRICS.find((f) => f.name === row.name)?.use.split(" ").includes(use))
      .map((row) => row.id);

  await db
    .insert(s.coutureServices)
    .values(
      SEED_SERVICES.map(({ use, ...service }, sort) => ({
        ...service,
        slug: slugify(service.name),
        image: img(service.image, 1200),
        gallery: service.gallery.map((id) => img(id, 1200)),
        fabricIds: fabricsFor(use),
        sort,
      })),
    )
    .onConflictDoNothing({ target: s.coutureServices.slug });
}

/* ─── Demo content upgrades ──────────────────────────────────────────────── */

// A marker row records which revision of the demo content a database has, so later
// improvements can reach databases that were seeded earlier — once, and only where the
// original demo rows are still in place.
const DEMO_KEY = "_demo";
const DEMO_VERSION = 2;

// Revision 2: the couture catalogue became men's suits and formal tailoring only.
const V1_SERVICE_SLUGS = ["bespoke-suit", "wedding-sherwani", "bandhgala-jacket", "made-to-measure-shirt", "kurta-set", "tailored-trousers"];
const V1_FABRIC_NAMES = [
  "Italian Wool — Midnight Navy",
  "Flannel — Charcoal",
  "Super 120s — Jet Black",
  "Donegal Tweed — Peat Brown",
  "Irish Linen — Sand",
  "Egyptian Cotton — White",
  "Oxford — Sky Blue",
  "Chambray — Indigo",
  "Raw Silk — Ivory",
  "Banarasi Brocade — Maroon",
  "Jamawar — Antique Gold",
  "Velvet — Emerald",
];
const V1_TO_V2_TEXT: [string, string][] = [
  ["/couture/bespoke-suit", "/couture/two-piece-suit"],
  ["/couture/wedding-sherwani", "/couture/three-piece-suit"],
  ["/couture/made-to-measure-shirt", "/couture/formal-shirt"],
  ["/couture/bandhgala-jacket", "/couture/jodhpuri-suit"],
  ["/couture/kurta-set", "/couture/blazer"],
  ["/couture/tailored-trousers", "/couture/formal-trousers"],
  ["Suits, sherwanis and shirts", "Suits, blazers and shirts"],
  ["cuts suits, sherwanis, bandhgalas and shirts", "cuts suits, tuxedos, blazers and shirts"],
  ["a wedding sherwani, a suit for the boardroom,", "a three-piece suit for the wedding, a navy two-piece for the boardroom,"],
  ["sent photos of the fabric options, and my sherwani arrived", "sent photos of the cloth options, and my three-piece suit arrived"],
  ["Suits take about three weeks and wedding sherwanis about four.", "Suits take about three weeks and tuxedos a little longer."],
  ["Mill-sourced wools, handloom silks and long-staple cottons.", "Mill-sourced wools, Irish linens and long-staple cottons."],
  ["have a suit, sherwani or shirt cut", "have a suit, blazer or shirt cut"],
  ["Wedding trousseau", "Wedding suits"],
  ["Wedding sherwani", "Three-piece suit"],
  ["Bespoke suit", "Two-piece suit"],
  ["Made-to-measure shirt", "Formal shirt"],
];

function replaceDeep<T>(value: T, pairs: [string, string][]): T {
  if (typeof value === "string") return pairs.reduce((text, [from, to]) => text.split(from).join(to), value as string) as T;
  if (Array.isArray(value)) return value.map((item) => replaceDeep(item, pairs)) as T;
  if (value && typeof value === "object" && !(value instanceof Date)) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, replaceDeep(item, pairs)])) as T;
  }
  return value;
}

const changed = (a: unknown, b: unknown) => JSON.stringify(a) !== JSON.stringify(b);

/** Brings a previously seeded database up to the current demo content. Safe to run every time. */
export async function upgradeDemoContent(db: DB) {
  const [marker] = await db.select().from(s.settings).where(eq(s.settings.key, DEMO_KEY)).limit(1);
  const version = Number((marker?.value as { version?: number } | undefined)?.version ?? 1);
  if (version >= DEMO_VERSION) return;

  await db.transaction(async (tx) => {
    // Only touch the catalogue if the original demo services are still there.
    const original = await tx
      .select({ id: s.coutureServices.id })
      .from(s.coutureServices)
      .where(inArray(s.coutureServices.slug, ["wedding-sherwani", "kurta-set"]));

    if (original.length > 0) {
      await tx.delete(s.coutureServices).where(inArray(s.coutureServices.slug, V1_SERVICE_SLUGS));
      await tx.delete(s.fabrics).where(inArray(s.fabrics.name, V1_FABRIC_NAMES));
      await insertCoutureCatalogue(tx);

      for (const page of await tx.select().from(s.pages)) {
        const sections = replaceDeep(page.sections, V1_TO_V2_TEXT);
        if (changed(sections, page.sections)) await tx.update(s.pages).set({ sections }).where(eq(s.pages.id, page.id));
      }
      for (const banner of await tx.select().from(s.banners)) {
        const before = { subtitle: banner.subtitle, ctaHref: banner.ctaHref, cta2Href: banner.cta2Href };
        const after = replaceDeep(before, V1_TO_V2_TEXT);
        if (changed(before, after)) await tx.update(s.banners).set(after).where(eq(s.banners.id, banner.id));
      }
      for (const row of await tx.select().from(s.settings).where(inArray(s.settings.key, ["navigation", "seo"]))) {
        const value = replaceDeep(row.value, V1_TO_V2_TEXT);
        if (changed(value, row.value)) await tx.update(s.settings).set({ value }).where(eq(s.settings.key, row.key));
      }
      console.log("[setup] Couture demo content updated: men's suits and formal tailoring.");
    }

    await tx
      .insert(s.settings)
      .values({ key: DEMO_KEY, value: { version: DEMO_VERSION } })
      .onConflictDoUpdate({ target: s.settings.key, set: { value: { version: DEMO_VERSION }, updatedAt: new Date() } });
  });
}

/** Fills a brand-new database with demo content. On an existing one it only applies upgrades. */
export async function seedIfEmpty(db: DB) {
  const existing = await db.select({ key: s.settings.key }).from(s.settings).limit(1);
  if (existing.length > 0) {
    await upgradeDemoContent(db);
    await ensureAdmin(db);
    return false;
  }

  console.log("[setup] Empty database detected — adding demo content…");

  await db.insert(s.settings).values([
    ...Object.entries(DEFAULT_CONFIG).map(([key, value]) => ({ key, value: value as Record<string, unknown> })),
    { key: DEMO_KEY, value: { version: DEMO_VERSION } },
  ]);

  await db.insert(s.banners).values([
    {
      placement: "home-hero",
      eyebrow: "Autumn / Winter collection",
      title: "Tailoring, without the stiffness",
      subtitle: "Soft-shouldered suits and separates in Italian wool. Ready to wear, ready to ship.",
      image: img(P.darkSuit, 1920),
      ctaLabel: "Shop suits",
      ctaHref: "/collections/suits-and-blazers",
      cta2Label: "New arrivals",
      cta2Href: "/shop?sort=newest",
      align: "left",
      overlay: 40,
      sort: 0,
    },
    {
      placement: "home-hero",
      eyebrow: "The couture house",
      title: "Made to your measure",
      subtitle: "Suits, blazers and shirts — drafted, cut and stitched for you alone.",
      image: img(P.mannequin, 1920),
      ctaLabel: "Start your order",
      ctaHref: "/couture",
      align: "left",
      overlay: 45,
      sort: 1,
    },
    {
      placement: "home-hero",
      eyebrow: "Everyday essentials",
      title: "The off-duty wardrobe",
      subtitle: "Heavyweight tees, washed shirts and denim that gets better with age.",
      image: img(P.flatlay, 1920),
      ctaLabel: "Shop the edit",
      ctaHref: "/shop",
      align: "center",
      overlay: 50,
      sort: 2,
    },
    {
      placement: "couture-hero",
      eyebrow: "Couture & stitching",
      title: "One pattern. One client.",
      subtitle: "Bespoke menswear, cut by hand in our own workshop.",
      image: img(P.suitTie, 1920),
      ctaLabel: "Choose your garment",
      ctaHref: "#services",
      align: "center",
      overlay: 50,
      sort: 0,
    },
  ]);

  const categoryRows = await db
    .insert(s.categories)
    .values(
      SEED_CATEGORIES.map((c, i) => ({
        name: c.name,
        slug: slugify(c.name),
        description: c.description,
        image: img(c.image, 1000),
        sort: i,
      })),
    )
    .returning();
  const categoryId = new Map(categoryRows.map((c) => [c.name, c.id]));

  for (const [index, p] of SEED_PRODUCTS.entries()) {
    const [product] = await db
      .insert(s.products)
      .values({
        name: p.name,
        slug: slugify(p.name),
        description: p.description,
        categoryId: categoryId.get(p.category) ?? null,
        price: p.price,
        compareAtPrice: p.compareAtPrice ?? null,
        images: p.images.map((id) => img(id, 1200)),
        sizes: p.sizes,
        colors: p.colors,
        tags: p.tags,
        fabric: p.fabric,
        fit: p.fit,
        care: p.category === "T-Shirts & Polos" || p.category === "Denim" || p.category === "Shirts" ? CARE_WASH : CARE,
        featured: Boolean(p.featured),
        isNew: Boolean(p.isNew),
        // Stagger creation times so "newest" sorting is stable.
        createdAt: new Date(Date.UTC(2026, 0, 1 + index)),
      })
      .returning({ id: s.products.id });

    const skuBase = slugify(p.name)
      .split("-")
      .map((w) => w[0])
      .join("")
      .toUpperCase();
    await db.insert(s.productVariants).values(
      p.colors.flatMap((color, ci) =>
        p.sizes.map((size, si) => ({
          productId: product.id,
          size,
          color: color.name,
          sku: `${skuBase}-${color.name.slice(0, 3).toUpperCase()}-${size}`,
          // Deterministic stock, with the occasional sold-out size.
          stock: (index + ci * 3 + si * 5) % 7 === 0 ? 0 : 3 + ((index * 5 + ci * 7 + si * 3) % 14),
        })),
      ),
    );
  }

  await insertCoutureCatalogue(db);

  await db.insert(s.pages).values(buildPages());

  await db.insert(s.coupons).values([
    { code: "WELCOME10", description: "10% off your first order", type: "percent", value: 10, minOrder: 1999, maxDiscount: 1000 },
    { code: "FLAT500", description: "₹500 off orders above ₹4,999", type: "fixed", value: 500, minOrder: 4999 },
  ]);

  await ensureAdmin(db);
  console.log("[setup] Demo content added.");
  return true;
}
