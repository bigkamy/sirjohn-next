# Sir John Golf Co.

Online store for golf equipment, built with Next.js 16 (App Router) and Supabase.

- Catalog with product options (hand orientation, shaft flex), wishlist, and search/filters
- Cart that persists for guests (cookie) and signed-in customers (database), merged on login
- Checkout priced entirely in the database, with stock locking and coupons
- Customer accounts: orders, addresses, profile, password reset, and verified product reviews
- A separate admin panel at `/admin` with roles (super admin, admin, manager, staff): dashboard,
  analytics, products, categories, inventory, media library, reviews, orders, payments, coupons,
  customers, staff, settings, security, and system health — see [supabase/README.md](supabase/README.md#admin-panel)
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
| `NEXT_PUBLIC_SITE_URL`          | Yes, in production  | e.g. `https://www.example.com` — canonical URLs, sitemap, auth email links, and the link in the order confirmation email |
| `RESEND_API_KEY`                | For order emails    | Server-side only. Never add `NEXT_PUBLIC_` to it                |
| `ORDER_EMAIL_FROM`              | For order emails    | e.g. `Sir John Golf Co. <orders@your-domain.com>`               |
| `ORDER_EMAIL_REPLY_TO`          | Optional            | Where customer replies go, if not the sender                    |

## Order confirmation emails

When an order is placed, the customer is emailed a confirmation: the items, options, totals,
delivery address, and a **View Your Order** button. Sending goes through
[Resend](https://resend.com) and happens on the server only.

**Setting it up**

1. Create a Resend account and add your sending domain under **Domains**. Resend gives you DNS
   records (a DKIM `TXT`, and an `MX` plus `TXT` for the return path) to add at whoever hosts
   your domain. The domain shows as **Verified** once they have propagated, usually within an
   hour. Until then only Resend's own `onboarding@resend.dev` sender works, and it can only
   email the address that owns the Resend account.
2. **API Keys → Create API Key**, with sending access.
3. Put the key in `RESEND_API_KEY` and your verified sender in `ORDER_EMAIL_FROM`, in
   `.env.local` for development and in your host's environment settings for production. Never
   commit either.

**How it behaves**

- The email is only sent after `place_order` has committed the order, its items and the stock
  change. It is sent after the response, so it never slows down or blocks checkout.
- Each order gets one email. The claim is taken in the database, so a refresh, a revisit or a
  duplicate submission cannot produce a second one.
- If sending fails the order still stands. The failure is recorded on the order and in the
  activity log; the customer is never shown the provider's error.
- Leave the variables unset and orders still work normally — no email goes out, and the admin
  dashboard and **System health** both say so.

**Checking it**

- `/admin/orders/<order number>` shows the email's status, when it was sent, and any failure,
  and staff with *Update order status* can resend it (at most once a minute per order).
- Locally, without a Resend key nothing is sent. To see a real email, set both variables and
  place a test order; with an unverified domain, send to the address that owns the Resend
  account. In production, place a small live order and check **Resend → Emails** for the
  delivery, then the order page in the admin for the recorded status.

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
| `lib/email/`          | Order confirmation email: the provider call, the template, and the send that claims it |
| `proxy.ts`            | Session refresh and redirects for signed-out visitors           |
| `supabase/`           | Migrations, sample seed data, and setup guide                   |
