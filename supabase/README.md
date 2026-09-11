# Supabase setup

The storefront runs without Supabase (it falls back to the sample catalog, and guests can
still fill a cart), but accounts, checkout, orders, wishlists, addresses, and the admin panel
need a Supabase project.

## 1. Environment

Copy `.env.example` to `.env.local` and fill in the values from
**Project Settings → API** in the Supabase dashboard:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon / publishable key>
```

## 2. Schema and sample data

Either link the CLI and push the migrations:

```
npx supabase link --project-ref <project-ref>
npx supabase db push
```

or paste each file in `migrations/` into the **SQL Editor**, in filename order, and run it:

| Migration                                   | Adds                                                                     |
| ------------------------------------------- | ------------------------------------------------------------------------ |
| `20260911000000_init.sql`                   | Profiles, catalog, addresses, wishlist, orders, RLS                      |
| `20260912000000_cart_checkout.sql`          | Cart, shipping methods, coupons, `quote_cart`, `place_order`             |
| `20260913000000_accounts_options_payments.sql` | Product options on cart and order lines, one default address, payment fields, `payments`, `mark_order_paid` |
| `20260914000000_admin_and_storefront.sql`   | Admin dashboard stats, stock adjustments, order status changes (cancel restocks), newsletter and contact form tables |
| `20260915000000_catalog_readiness.sql`      | `products.is_sample` flag for demo data, category images                 |

`seed.sql` is **sample data for development and testing** — six demo products (flagged
`is_sample`, labelled “Sample” in the store, with a placeholder image and no ratings), the
default categories, and a `WELCOME10` test coupon. Run it on a development project to try the
store; in production either skip it or remove the samples from `/admin/products` once your
real products are in. It is safe to re-run.

## 3. Auth URLs

In **Authentication → URL Configuration**:

- **Site URL**: `http://localhost:3000` (your production domain once deployed)
- **Redirect URLs**: add `http://localhost:3000/auth/confirm` and the production equivalent

Recommended — in **Authentication → Email Templates**, point the links at the app so they
work even when opened in a different browser from the one that requested them:

| Template        | Link                                                                                          |
| --------------- | --------------------------------------------------------------------------------------------- |
| Confirm signup  | `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/account`             |
| Reset password  | `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/account/reset-password` |

## 4. Make yourself an admin

Register through `/register`, then run in the SQL Editor:

```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'you@example.com');
```

Roles can't be changed from the app: customers only have update rights on
`first_name`, `last_name`, and `phone`.

## Pricing and checkout

All money is computed in the database, never in the browser:

- `quote_cart(items, shipping_method, coupon_code)` prices a cart from current product
  prices, shipping rules, and coupon rules. The cart and checkout pages only display its result.
- `place_order(...)` runs in one transaction: it locks the cart and product rows, re-checks
  stock (summed across every configuration of a product) and each line's options, re-prices
  with `quote_cart`, writes `orders` and `order_items`, decrements stock, consumes the coupon,
  and empties the cart. Customers have no insert rights on orders.

Business rules live in tables, so they can be changed without a deploy:

| Table              | Default                                                                  | Managed from        |
| ------------------ | ------------------------------------------------------------------------ | ------------------- |
| `shipping_methods` | Standard ₹799, free from ₹2,999 · Express ₹799                           | `/admin/shipping`   |
| `coupons`          | `WELCOME10` (from `seed.sql`): 10% off orders ≥ ₹5,000, max ₹5,000 off | SQL Editor          |
| `products.options` | Set per product (sample clubs: Hand Orientation + Shaft Flex)            | `/admin/products`   |
| `categories`       | Clubs, Bags, Apparel, Accessories, Footwear, Balls                       | `/admin/categories` |

The storefront's "Free shipping over …" copy is read from `shipping_methods` too, so it always
matches what checkout charges.

## Product options

`products.options` lists the choices a customer must make, e.g.
`[{"name": "Hand Orientation", "values": ["Right Hand", "Left Hand"]}]`. The selection is
validated by `product_options_valid` when adding to the cart and again in `place_order`, stored
on each `cart_items` row (so one club in two configurations is two lines), and copied into
`order_items.options` permanently — customers and admins both see it on the order.

## Payments (ready for Razorpay)

Orders are created with `status = 'pending'` and `payment_status = 'pending'`; no gateway is
connected yet. The schema is ready for one:

1. After `place_order`, a server-side route creates the provider order using `orders.total`
   from the database (never an amount sent by the browser) and records the attempt in `payments`.
2. The browser opens the provider's checkout.
3. A route handler / webhook verifies the provider's signature with the secret key, then calls
   `mark_order_paid(order_id, provider, provider_order_id, provider_payment_id, amount, raw)` using
   the **service role** key. It is idempotent, refuses amounts that don't match the order, and
   moves the order to `processing`. Customers and anonymous users cannot call it.

## How it is wired

| Piece                     | Role                                                                                   |
| ------------------------- | -------------------------------------------------------------------------------------- |
| `proxy.ts`                | Refreshes the session; redirects signed-out visitors away from `/account`, `/admin`, `/checkout`, `/order-success` |
| `lib/auth/dal.ts`         | `getCurrentUser` / `requireUser` / `requireAdmin` — the authoritative checks pages and actions use |
| `lib/cart.ts`             | Reads the cart: `cart_items` when signed in, an httpOnly cookie for guests; merges the guest cart on login |
| `lib/*-actions.ts`        | Server Actions for auth, cart, checkout, wishlist, addresses, profile, and admin shipping |
| `app/api/shopper`         | Session, cart count, and wishlist for the header, read on the client so store pages stay static |
| `lib/supabase/public.ts`  | Cookie-free client for the public catalog, so product pages stay statically generated |

## Access rules at a glance

| Data               | Customers                                   | Admins                     |
| ------------------ | ------------------------------------------- | -------------------------- |
| Profiles           | Read own; update name and phone only        | Read all                   |
| Cart, wishlist, addresses | Full control of their own rows only  | —                          |
| Orders, order items | Read own; created only via `place_order`   | Read all; update orders    |
| Products, categories, shipping methods | Read active rows            | Full control               |
| Coupons, payments  | No access                                   | Coupons: full · Payments: read |
| Newsletter, contact messages | Submit only (via functions), can't read back | Read (contact: also mark handled) |

## Admin panel

| Page               | What it does                                                                 |
| ------------------ | ---------------------------------------------------------------------------- |
| `/admin`           | Launch checklist (missing business details, sample products, placeholder images, draft policies), live figures from `admin_dashboard_stats`, and the latest orders |
| `/admin/categories` | Add, rename, reorder, and delete categories and set their home page image. Renaming moves the products with it; categories with products can't be deleted |
| `/admin/orders`    | All orders; each order page changes its status (`admin_set_order_status`). Cancelling returns stock and the coupon use; shipped orders can only be delivered |
| `/admin/products`  | Add and edit products (including options and images), hide/show, add or remove stock with `adjust_product_stock` (relative, so it can't undo a sale made in the meantime), and remove all sample products |
| `/admin/shipping`  | Shipping prices and free-shipping thresholds                                 |

Contact messages and newsletter sign-ups are read in the Supabase dashboard
(`contact_messages`, `newsletter_subscribers`) until an admin inbox is added.
