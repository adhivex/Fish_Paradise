# Fish Paradise

Online seafood store: a mobile-first PWA for customers (fish, prawns and crab by weight, cleaned to order,
delivery slots, UPI/card/net banking via Razorpay or cash on delivery) plus a mobile-friendly admin panel
for the shop owner.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS 4 · Zustand + SWR ·
Supabase Postgres + Prisma 6 · Zod · Razorpay · MSG91 / WhatsApp · Cloudinary · Sentry · Vitest ·
Playwright · pnpm.

## Status

All ten build phases are implemented (`docs/BUILD_PLAN.md`). What still needs the shop owner – real
products and prices, phone, FSSAI number, delivery areas, live keys and template approvals – is listed in
**[docs/LAUNCH_CHECKLIST.md](docs/LAUNCH_CHECKLIST.md)**.

| Phase | Scope                                                                                                                                 | State |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| 0–1   | Scaffold, tooling, design system, all customer screens                                                                                | Done  |
| 2     | Database, cached catalogue API, server-side filtering                                                                                 | Done  |
| 3     | Phone + OTP login (hashed, expiring, rate limited), sessions, route protection                                                        | Done  |
| 4     | Server cart + quotes, addresses, pincode check, IST slots with capacity, coupons                                                      | Done  |
| 5     | Order transaction with snapshots, Razorpay + signed idempotent webhook, COD, `transitionOrder`, unpaid expiry                         | Done  |
| 6     | Live tracking timeline, My orders, customer cancel, order again, call shop                                                            | Done  |
| 7     | Admin: order queue with alerts, order processing, today's catalogue editor, products/categories/cleaning, delivery, coupons, settings | Done  |
| 8     | Notifications (console / WhatsApp / SMS) with delivery log, never blocking orders                                                     | Done  |
| 9     | PWA (manifest, icons, service worker, offline page), SEO, structured data, legal pages, a11y                                          | Done  |
| 10    | Security headers + CSP, rate limits, Sentry, structured logs, e2e suite, deploy config, launch checklist                              | Done  |

## Run it locally

Requirements: Node 20+, pnpm 9 (`npm i -g pnpm@9`) and a Postgres database (Supabase, or Docker below).

```bash
cp .env.example .env        # then set DATABASE_URL / DIRECT_URL (see "Database")
pnpm install
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Open http://localhost:3000 (use the browser's device toolbar at 390px).

- **Log in:** any Indian mobile number. With `OTP_PROVIDER=console` the code is printed in the terminal
  and shown on screen in development.
- **Admin:** set `ADMIN_PHONE=+91XXXXXXXXXX` in `.env`, log in with that number and open `/admin`.
- **Payments:** with `PAYMENT_PROVIDER=fake` (default) online payments open a local test-payment page that
  sends a correctly signed webhook through the real handler. Set `PAYMENT_PROVIDER=razorpay` with Razorpay
  **test** keys to use Razorpay Checkout (the webhook must then reach your machine, e.g. via a tunnel).

### Checks

```bash
pnpm lint && pnpm typecheck && pnpm test   # unit + route-handler tests (no database needed)
pnpm test:integration                      # services against the database in .env
pnpm e2e                                   # Playwright (starts the dev server on :3100); PW_CHANNEL=msedge to use installed Edge
pnpm build
```

`pnpm e2e` and `pnpm test:integration` must point at a **local** test database – they create and delete
test users and orders.

## Database (Supabase)

1. Create a Supabase project (region close to your customers, e.g. Mumbai `ap-south-1`).
2. **Project Settings → Database → Connection string**:
   - _Transaction pooler_ (port 6543) → `DATABASE_URL`, append `?pgbouncer=true&connection_limit=1`
   - _Session pooler / direct_ (port 5432) → `DIRECT_URL` (used by migrations)
3. `pnpm db:migrate` (development) or `pnpm db:deploy` (production), then `pnpm db:seed` for sample data
   in development only.

Offline fallback: `pnpm db:up` starts Postgres in Docker; point both URLs at
`postgresql://fish:fish@localhost:5432/fishparadise`.

## Deploy

Vercel + Supabase, configured in `vercel.json` (Mumbai region, cron for unpaid-order expiry). The build
command `pnpm vercel-build` generates the Prisma client, applies migrations and builds – the seed is never
run in production. Full list of environment variables: `.env.example`; step-by-step:
`docs/LAUNCH_CHECKLIST.md`.

## How it fits together

- **Prices** are integer paise, weights integer grams. The browser only sends product ids, grams and a
  cleaning option; every total comes from the server quote (`src/lib/cart.ts` → `POST /api/cart/quote`), and
  orders are re-priced inside the order transaction.
- **Orders** snapshot names, prices, cleaning and address. Status changes only through
  `transitionOrder` (`src/server/services/orders.ts`), which writes an `OrderEvent`, releases stock/coupons on
  cancel and queues notifications.
- **Payments** are marked paid only by the verified Razorpay webhook (`src/server/services/payments.ts`),
  idempotent via `WebhookEvent`.
- **Admin** is gated in `src/proxy.ts` and again in every handler (`requireAdmin`).
- **Catalogue** reads are cached under the `catalogue` tag and refreshed instantly on admin changes.

## Project layout

| Path                                                                   | Purpose                                                                                                       |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `src/app/(store)`                                                      | Customer pages (480px mobile shell)                                                                           |
| `src/app/admin`                                                        | Admin panel                                                                                                   |
| `src/app/api`                                                          | Route handlers (Zod → service → `{ data }` / `{ error }`)                                                     |
| `src/components/ui`, `src/components/features`, `src/components/admin` | Design system, customer screens, admin screens                                                                |
| `src/lib`                                                              | Pure business logic with tests (money, qty, quote, coupons, slots/IST, OTP rules, order rules, notifications) |
| `src/server`                                                           | Server-only: Prisma client, auth/session, rate limiting, services                                             |
| `prisma/`                                                              | Schema, migrations, seed data                                                                                 |
| `e2e/`                                                                 | Playwright suite (customer flow, admin, accessibility)                                                        |
| `docs/`                                                                | PRD, design system, data model, API, build plan, launch checklist                                             |
