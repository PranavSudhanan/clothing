# Atelier — menswear store with ready-to-wear and couture

A complete e-commerce application for a clothing brand that sells **ready-made menswear** and takes **stitching (couture) orders**, with an admin panel that controls the whole storefront: theme, page layout, banners, navigation, products, couture services and orders.

Built with Next.js 16 (App Router, Cache Components), Tailwind CSS 4, Drizzle ORM and Postgres. Designed for **Vercel + Neon**.

## Run it locally

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. No database setup is needed: with an empty `DATABASE_URL` the app uses an embedded Postgres stored in `./.data`, creates the tables and fills in demo content on first start.

- **Storefront:** `/`
- **Admin panel:** `/admin` — the local login is in `.env.local` (`ADMIN_EMAIL` / `ADMIN_PASSWORD`)

To start again from the demo content, stop the server and delete the `.data` folder.

> The embedded database is for development only and can be opened by one process at a time. To develop against Neon instead, put your connection string in `DATABASE_URL` in `.env.local`.

## Deploy to Vercel with Neon

1. **Push this folder to a Git repository** (GitHub, GitLab or Bitbucket).
2. **Create a Neon project** at <https://neon.tech> and copy the **pooled** connection string.
3. **Import the repository in Vercel** and add these environment variables before the first deploy:

   | Variable | Required | What it is |
   | --- | --- | --- |
   | `DATABASE_URL` | yes | Neon pooled connection string |
   | `SESSION_SECRET` | yes | Long random string. Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
   | `ADMIN_EMAIL` | yes | Email for the first admin account |
   | `ADMIN_PASSWORD` | yes | Password for the first admin account (8+ characters) |
   | `NEXT_PUBLIC_SITE_URL` | recommended | Your live URL, e.g. `https://www.yourbrand.com` (sitemap and social previews) |
   | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | optional | Enables online payments. Without them only cash on delivery is offered |
   | `RAZORPAY_WEBHOOK_SECRET` | optional | See `.env.example` |

4. **Deploy.** The build runs `scripts/db-setup.ts` first, which applies the migrations in `drizzle/`, adds demo content to an empty database and creates the admin account.
5. **Enable image uploads:** in Vercel open **Storage → Create → Blob**, connect it to the project (this adds `BLOB_READ_WRITE_TOKEN`) and redeploy. Until then you can still paste image URLs anywhere an image is needed.
6. Sign in at `/admin`, change the password under **Settings → Admin account**, and replace the demo content with your own.

Instead of copying the connection string by hand you can add Neon from the Vercel Marketplace; it sets `DATABASE_URL` for you.

## What the admin panel controls

| Area | What you can change |
| --- | --- |
| **Theme** | Five presets, every colour, heading and body fonts, corner radius, page width, spacing, header layout, product card style, grid columns, custom CSS — with a live preview |
| **Pages & layout** | Every page (home, couture landing, about, policies, any new page) is a list of sections you add, reorder, hide, duplicate and edit. 16 section types: hero slider, category tiles, product collections, image with text, couture services, process steps, testimonials, lookbook, FAQ, fabrics, newsletter, contact form, rich text and more |
| **Banners** | Hero slides grouped by placement, with scheduling, mobile images, buttons and overlay strength |
| **Navigation** | Announcement bar, header menu with dropdowns, footer columns |
| **Products** | Images, pricing and sale price, sizes × colours with per-variant stock and SKU, categories, tags, featured and new flags, SEO |
| **Couture** | Services with their own style options, price differences, measurement form and lead time; fabric library with surcharges |
| **Orders** | Status, payment, tracking number and link, internal notes. Cancelling an order returns its stock |
| **Couture orders** | Full specification and measurements, final quote, advance received, fitting date, workshop stage |
| **Also** | Customers, coupons, contact messages, newsletter subscribers (CSV export), media library, store settings, shipping, tax, SEO |

## What customers get

- Catalogue with category pages, search, filters (size, colour, price), sorting and pagination
- Product pages with gallery, variant selection, live stock, size guide, wishlist
- Cart, coupon codes, guest or signed-in checkout, cash on delivery and Razorpay
- Order confirmation and tracking pages, plus look-up by order number and email
- Couture configurator: choose fabric → style options → how to be measured (enter measurements, studio visit, home visit or send a garment) → details, with a live price estimate
- Accounts with order history, saved addresses and reusable measurement profiles

## Project layout

```
src/
  app/
    (store)/          storefront routes
    admin/            admin panel (login + protected panel)
    api/              image upload, Razorpay webhook
  components/
    store/            storefront UI, section renderer, cart, checkout, configurator
    admin/            admin shell, schema-driven form builder, editors
  db/                 schema, connection, demo seed
  lib/
    data.ts           cached public reads (tagged, invalidated by admin saves)
    admin-data.ts     admin reads (each one checks the admin session)
    actions/          server actions: store.ts (checkout, couture, accounts), admin.ts
    sections.ts       section catalogue used by the page builder
    resources.ts      form and table definitions for the admin panel
    defaults.ts       default settings, fonts and theme presets
drizzle/              SQL migrations
scripts/db-setup.ts   migrate + seed (runs before every build)
```

## Useful commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Migrate and seed the database, then build for production |
| `npm run db:setup` | Apply migrations and seed an empty database |
| `npm run db:generate` | Create a new migration after editing `src/db/schema.ts` |
| `npm run lint` / `npm run typecheck` | Code checks |

## Good to know

- **Prices** are entered in whole currency units (for example `2499`). The currency and number format are set under Settings → Checkout & shipping.
- **Caching:** storefront pages are prerendered and cached; saving anything in the admin panel refreshes the affected pages immediately.
- **Adding a section type:** describe its fields in `src/lib/sections.ts` and render it in `src/components/store/sections.tsx`. The page builder picks it up automatically.
- **Changing the database schema:** edit `src/db/schema.ts`, run `npm run db:generate`, commit the new file in `drizzle/`. It is applied on the next build.
- **Not included yet:** transactional emails (order confirmations), product reviews and login rate limiting.
