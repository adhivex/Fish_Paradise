# Build Plan (10 phases)

Work one phase at a time. Each phase ends with: lint + typecheck + tests green, manual check at 390px, a short summary, and a commit.

## Phase 0 – Scaffold & tooling

Next.js + TypeScript strict + Tailwind (theme from `docs/DESIGN_SYSTEM.md`), pnpm, ESLint/Prettier, Vitest, Playwright, `next/font` (Fraunces, DM Sans), Prisma, docker compose DB, scripts from `CLAUDE.md`, `.env.example`, CI workflow (lint, typecheck, test, build).
**Done when:** `pnpm dev` shows a styled placeholder; `pnpm db:migrate && pnpm db:seed` works against the Supabase project in `.env`.

## Phase 1 – Design system & customer UI with mock data

Build all UI components and all 10 screens from the prototype using an in-memory mock catalogue (same product data as the seed). Cart state in a client store (Zustand). Include the Filter sheet, toast, bottom nav, skeletons, empty states, and the mobile shell (max-width 480px, safe-area).
**Done when:** the full flow Home → … → Confirmed → Tracking → Orders works with mock data and matches the prototype visually at 390px.

## Phase 2 – Database & catalogue

Migrate + seed. `GET /api/catalogue`, `/api/products/:slug`, `/api/shop`. Replace mock data with server data (Server Components + ISR, tagged revalidation). Sold-out UI state. Search, category, sort and price-band filtering done server-side.
**Done when:** UI shows seeded products; prices come only from the DB.

## Phase 3 – Authentication

OTP request/verify with rate limits, hashing, expiry, attempts; session cookie; middleware; login sheet at checkout; profile; logout. `console` OTP provider for dev, MSG91 adapter behind the same interface. Guest cart merge.
**Done when:** unit tests cover OTP rules; e2e: login flow with the dev provider.

## Phase 4 – Cart, addresses, checkout

Server cart with re-pricing; address CRUD and pincode serviceability + fee; slot listing (ASAP + scheduled with capacity); coupon validation; checkout summary from server totals.
**Done when:** totals in UI always equal server totals; unserviceable pincode blocks checkout.

## Phase 5 – Orders & payments

`POST /api/orders` transaction; Razorpay order + Checkout.js; webhook with signature verification and idempotency; COD flow; unpaid-order expiry job; `transitionOrder` service.
**Done when:** test-mode Razorpay payment confirms an order via webhook; replaying the webhook does nothing twice; COD works.

## Phase 6 – Tracking & My orders

Order detail with `OrderEvent` timeline, status filter chips, cancel rules, reorder button ("Order again" copies lines to cart), call-shop button.
**Done when:** timeline reflects real events; cancellation rules enforced server-side.

## Phase 7 – Admin panel

`/admin` (mobile-first, ADMIN only): **Today's catalogue** fast inline editor (price, available toggle, stock), orders queue with sound/visual alert for new orders (polling every 15 s or SSE), order detail with status buttons and call/WhatsApp, products/categories/cleaning CRUD with image upload, zones, slots, coupons, settings (accepting orders switch).
**Done when:** the owner can update all prices and availability in one screen and process an order end to end.

## Phase 8 – Notifications

Notification service with `console` and WhatsApp/SMS providers; templates for confirmed, out for delivery, delivered, cancelled; owner alert on new order. Failures are logged and never block order flow.

## Phase 9 – PWA, SEO, performance, accessibility

Manifest, icons, service worker (offline shell + last catalogue), metadata/OG, sitemap, structured data for the shop, image optimisation, Lighthouse and axe checks, legal pages (privacy, terms, refund policy, contact) with placeholders.
**Done when:** Lighthouse mobile Performance ≥ 85, Accessibility ≥ 95, installable.

## Phase 10 – Hardening & launch

Rate limiting, security headers, Sentry, backups, seed-free production migration, e2e suite for the main flows, load test of catalogue, deployment (Vercel + Supabase) and a launch checklist: real products/photos/prices, FSSAI number, delivery pincodes, Razorpay live keys and webhook URL, MSG91 DLT template approval, WhatsApp template approval, domain + SSL.
