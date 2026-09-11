# Sir John Golf Co.

Online store for golf equipment, built with Next.js 16 (App Router) and Supabase.

- Catalog with product options (hand orientation, shaft flex), wishlist, and search/filters
- Cart that persists for guests (cookie) and signed-in customers (database), merged on login
- Checkout priced entirely in the database, with stock locking and coupons
- Customer accounts: orders, addresses, profile, password reset
- Admin panel: dashboard with launch checklist, products and stock, categories, orders, shipping rates
- Shipping, Returns & Refund, Privacy, and Terms pages

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev
```

Without Supabase settings the store runs on a small sample catalog, which is enough to work
on the storefront. Accounts, checkout, and the admin panel need a Supabase project — see
[supabase/README.md](supabase/README.md) for the schema, migrations, and dashboard settings.

## Scripts

| Command         | What it does                   |
| --------------- | ------------------------------ |
| `npm run dev`   | Development server             |
| `npm run build` | Production build (type-checks) |
| `npm run start` | Serve the production build     |
| `npm run lint`  | ESLint                         |

## Environment variables

| Name                            | Required            | Notes                                                         |
| ------------------------------- | ------------------- | ------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Yes                 | Project URL                                                   |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes                 | Anon / publishable key (safe in the browser)                  |
| `NEXT_PUBLIC_SITE_URL`          | Yes, in production  | e.g. `https://www.example.com` — canonical URLs, sitemap, auth email links |

## Replacing the sample content

Nothing below is real business information yet. The admin dashboard's **launch checklist**
shows what is still outstanding.

| What                           | Where                                                                                   |
| ------------------------------ | --------------------------------------------------------------------------------------- |
| Business name, legal name, address, phone, email, hours, social links | [`lib/site-config.ts`](lib/site-config.ts) — anything left `null` is hidden on the site |
| Customer reviews, About page figures | `testimonials` and `aboutStats` in `lib/site-config.ts` (hidden while empty)       |
| Home, login, and About page photos | [`lib/site-images.ts`](lib/site-images.ts)                                          |
| Products, photos, options, stock | `/admin/products`. Sample products are labelled “Sample”; remove them all from the dashboard or products page once your products are in |
| Categories and their images    | `/admin/categories`                                                                     |
| Shipping prices                | `/admin/shipping`                                                                       |
| Policies                       | [`lib/policies.ts`](lib/policies.ts) — replace each highlighted `{{placeholder}}`. Draft policies show a notice and stay out of search results until complete |
| Logo                           | `brand.logoSrc` in `lib/site-config.ts` (e.g. `/images/logo.svg`), or edit `brand.wordmark` |
| Favicon and app icon           | Generated from `brand.monogram` and colours by `app/icon.tsx` and `app/apple-icon.tsx`. To use your own files, add `app/icon.png` (or `.svg`) and a 180×180 `app/apple-icon.png`, and delete the two `.tsx` files |

Product images can be a full `https://` URL or a file you place in `public/images/`
(entered as `/images/your-file.jpg`). Products without a photo use
`/images/product-placeholder.svg`, which the admin marks as “Placeholder image”.

## Project layout

| Path                  | Contents                                                        |
| --------------------- | --------------------------------------------------------------- |
| `app/`                | Routes (storefront, `account/`, `admin/`, `policies/`, `api/`, `auth/`) |
| `components/`         | UI, grouped by area                                             |
| `lib/`                | Data access and Server Actions (`*-actions.ts`)                 |
| `lib/auth/dal.ts`     | `requireUser` / `requireAdmin` — the checks every page and action uses |
| `proxy.ts`            | Session refresh and redirects for signed-out visitors           |
| `supabase/`           | Migrations, sample seed data, and setup guide                   |
