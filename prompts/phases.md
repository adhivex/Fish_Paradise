# Phase prompts (paste one at a time, after the previous phase is committed)

Common footer for every prompt: _Follow `CLAUDE.md`. Read the relevant docs first. Run lint, typecheck and tests. Commit. Then summarise what changed, what is placeholder, and how to verify manually._

## Phase 2 – Database & catalogue

Do Phase 2 from `docs/BUILD_PLAN.md`. Run the migration and seed. Implement `GET /api/catalogue`, `GET /api/products/:slug`, `GET /api/shop` per `docs/API.md` with Zod validation and the response envelope. Replace the mock catalogue with server data using Server Components and tagged revalidation (`catalogue`). Implement server-side search, category, sort (`rec|low|high|az`) and price-band filtering (bands from `ShopSettings.priceBandsPaise`). Add the "Sold out today" state to list, product and cart. Add integration tests for filtering and sorting.

## Phase 3 – Authentication

Do Phase 3. Implement phone + OTP: request and verify endpoints, hashed codes, 5-minute expiry, max 5 attempts, rate limits per phone and IP, an `OtpProvider` interface with `console` and `msg91` adapters, session cookie (httpOnly, secure, sameSite=lax), route protection middleware, login bottom sheet used at checkout, profile edit, logout, and guest-cart merge on login. Write unit tests for every OTP rule and one Playwright test for the login flow using the console provider.

## Phase 4 – Cart, addresses, checkout

Do Phase 4. Build the server cart with re-pricing (never trust client totals), address CRUD, `GET /api/delivery/check`, `GET /api/slots` (ASAP availability from shop hours and `acceptingOrders`, scheduled slots with remaining capacity), coupon validation and the checkout summary. Show clear errors for unserviceable pincode, minimum order, sold-out lines and closed shop. Unit-test the pricing, coupon and delivery-fee functions thoroughly.

## Phase 5 – Orders & payments

Do Phase 5. Implement `POST /api/orders` as one transaction exactly as described in `docs/DATA_MODEL.md` (snapshots, order number, stock, coupon use, cart clear). Add Razorpay order creation, Checkout.js integration on the Payment screen, the webhook with raw-body signature verification and idempotency via `WebhookEvent`, the COD flow, the unpaid-order expiry job, and `transitionOrder`. Never mark an order paid from the browser. Add tests: webhook replay, bad signature, transition rules, expiry.

## Phase 6 – Tracking & My orders

Do Phase 6. Build order detail and the timeline from `OrderEvent`, status filter chips on My orders, customer cancel rules enforced server-side, "Order again" (copies lines to cart, skipping sold-out items with a message), and the Call shop button from `ShopSettings.phone`.

## Phase 7 – Admin panel

Do Phase 7. Build `/admin` (ADMIN only, mobile-first): the fast "Today's catalogue" inline editor (price, available toggle, optional stock, bulk save writing `ProductPrice` history and revalidating the `catalogue` tag), the orders queue with new-order alert (15 s polling), order detail with status buttons and call/WhatsApp links, product/category/cleaning CRUD with Cloudinary signed uploads, delivery zones, slot templates, coupons, and settings including the accepting-orders switch. Add e2e coverage for updating a price and processing an order.

## Phase 8 – Notifications

Do Phase 8. Create a notification service with `console` and WhatsApp/SMS providers, templates for confirmed, out for delivery, delivered and cancelled, and an owner alert on new orders. Failures must be logged and must never block order or status changes. Add tests with a fake provider.

## Phase 9 – PWA, SEO, performance, accessibility

Do Phase 9. Add manifest, icons, service worker (offline shell + last catalogue), metadata and Open Graph, sitemap and robots, LocalBusiness structured data, image optimisation, legal pages with placeholders (privacy, terms, refund and cancellation, contact). Run Lighthouse (mobile) and axe; fix issues until Performance ≥ 85 and Accessibility ≥ 95. Report the scores.

## Phase 10 – Hardening & launch

Do Phase 10. Add rate limiting and security headers, Sentry, structured logging for payments/webhooks/notifications, a complete Playwright suite for the main customer and admin flows, production migration steps without seed data, deployment configuration, and a `docs/LAUNCH_CHECKLIST.md` (real products and photos, prices, FSSAI number, delivery pincodes, Razorpay live keys and webhook URL, MSG91 DLT template approval, WhatsApp template approval, domain and SSL, backups).

## Useful one-off prompts

- **Visual polish:** "Compare the running UI with `design/prototype/Main.dc.html` screen by screen at 390px and fix every visual difference in spacing, type, colour and states."
- **Real photos:** "Replace the illustrated placeholder tiles with `next/image` using Cloudinary URLs; keep the dark tile fallback when `imageUrl` is empty."
- **Security review:** "Review the whole codebase for auth, authorisation, injection, rate-limit, payment and webhook weaknesses and list findings by severity, then fix the high ones."
