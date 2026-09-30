# API Contract

All routes are Next.js Route Handlers under `/api`. JSON in/out. Success: `{ "data": ... }`. Error: `{ "error": { "code": "STRING", "message": "Human readable" } }` with proper HTTP status.
Validate every body/query with Zod. Money in paise, weights in grams. Auth = session cookie; `ADMIN` routes require role.

## Public

| Method & path                                               | Purpose                                                                                                                                                                                                                                                                           |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/catalogue?category=&q=&sort=&priceBand=`          | Products with today's price/availability, categories, cleaning options, price bands. `sort` = `rec`, `low`, `high` or `az`; `priceBand` = `any` or `b0`…`bN` from `ShopSettings.priceBandsPaise`. Unknown category/band fall back to all/any; the applied `filter` is echoed back |
| `GET /api/products/:slug`                                   | Product detail                                                                                                                                                                                                                                                                    |
| `GET /api/shop`                                             | Public shop settings (name, phone, hours, accepting orders, FSSAI, price bands)                                                                                                                                                                                                   |
| `GET /api/delivery/check?pincode=`                          | `{ serviceable, feePaise, freeAbovePaise, minOrderPaise }`                                                                                                                                                                                                                        |
| `GET /api/slots`                                            | ASAP availability (open hours + accepting orders, IST) and the next occurrence of each scheduled slot with remaining capacity                                                                                                                                                     |
| `POST /api/cart/quote` `{ items, couponCode?, addressId? }` | Server price for any cart (guest or logged in): lines, subtotal, discount, delivery fee, total, blockers. Every total in the UI comes from here                                                                                                                                   |

## Auth

| Method & path                                 | Purpose                                   |
| --------------------------------------------- | ----------------------------------------- |
| `POST /api/auth/otp/request` `{ phone }`      | Send OTP (rate limited per phone and IP)  |
| `POST /api/auth/otp/verify` `{ phone, code }` | Verify; creates user if new; sets session |
| `POST /api/auth/logout`                       | Clear session                             |
| `GET /api/me` / `PATCH /api/me`               | Profile (name, email)                     |

## Customer (login required)

| Method & path                                                      | Purpose                                                                                     |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| `GET/PUT /api/cart`                                                | Read cart with server-priced totals / replace cart (`items`, `notes`, `couponCode`)         |
| `POST /api/cart/items` · `PATCH/DELETE /api/cart/items/:productId` | Add / change grams or cleaning / remove                                                     |
| `POST /api/cart/merge`                                             | Merge guest cart after login                                                                |
| `POST /api/coupons/validate` `{ code }`                            | Discount preview                                                                            |
| `GET/POST /api/addresses` · `PATCH/DELETE /api/addresses/:id`      | Address book                                                                                |
| `GET /api/favorites` · `POST/DELETE /api/favorites/:productId`     | Favourites                                                                                  |
| `POST /api/orders` `{ addressId, slot, paymentMethod, notes }`     | Create order from cart (see DATA_MODEL). Returns order + Razorpay params for online methods |
| `GET /api/orders?status=` · `GET /api/orders/:orderNumber`         | My orders / order detail with events (timeline)                                             |
| `POST /api/orders/:orderNumber/cancel` `{ reason }`                | Customer cancel when allowed (before cleaning starts)                                       |
| `POST /api/orders/:orderNumber/pay`                                | New payment attempt for an unpaid online order                                              |
| `POST /api/orders/:orderNumber/reorder`                            | Lines for "Order again" (sold-out items are skipped and listed)                             |
| `POST /api/payments/verify`                                        | Optional client-side signature check to speed up UI; **not** the source of truth            |

## Webhooks

| `POST /api/webhooks/razorpay` | Verify `X-Razorpay-Signature` with the raw body; insert into `WebhookEvent` (idempotent); on `payment.captured` mark paid + confirm order; on `payment.failed` record failure |

## Admin (`/api/admin/*`, role ADMIN)

| Method & path                                                  | Purpose                                                                                                                             |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/admin/catalogue` · `PATCH /api/admin/catalogue/bulk` | List all products; bulk update `pricePerKgPaise`, `todayAvailable`, `stockGrams` (writes `ProductPrice` history, revalidates cache) |
| `CRUD /api/admin/products`, `/categories`, `/cleaning-options` | Catalogue management                                                                                                                |
| `POST /api/admin/uploads/sign`                                 | Signed Cloudinary upload params                                                                                                     |
| `GET /api/admin/orders?queue=new                               | preparing                                                                                                                           | out | done&date=`·`GET /api/admin/orders/:id` | Order queue (with counts and pending refunds) and detail (payments, events, notification log) |
| `POST /api/admin/orders/:id/status` `{ to, note }`             | Advance/cancel via `transitionOrder`                                                                                                |
| `POST /api/admin/orders/:id/refund`                            | Mark refund done (manual in MVP)                                                                                                    |
| `CRUD /api/admin/zones`, `/slots`, `/coupons`                  | Delivery zones, slot templates, coupons                                                                                             |
| `GET/PATCH /api/admin/settings`                                | Shop settings (accepting orders, hours, contact, FSSAI, price bands)                                                                |

## Background jobs (cron endpoints or scheduled functions, secured with a secret)

- `GET /api/cron/expire-unpaid` (`Authorization: Bearer CRON_SECRET`, scheduled in `vercel.json`): cancel unpaid online orders older than `unpaidCancelMinutes` and release stock/coupon.
- Optional (not built): daily summary to the owner on WhatsApp.

## Development only

- `POST /api/dev/fake-pay` `{ orderNumber, outcome }` – with `PAYMENT_PROVIDER=fake` outside production, sends a correctly signed Razorpay-style webhook through the real handler (used by the `/pay/:orderNumber` test page). Returns 404 otherwise.

## Rate limits

OTP requests: 30 s cooldown, 5/hour per phone, 20/hour per IP. OTP verification: 5 attempts per code, 30/hour per IP. Order creation 10 per 10 min, coupon checks 20 per 10 min, address writes 30/hour per user. Exceeding returns `429` with `Retry-After`.

## Error codes (examples)

`VALIDATION`, `NOT_FOUND`, `UNAUTHENTICATED`, `FORBIDDEN`, `CONFLICT`, `RATE_LIMITED`, `OTP_INVALID`, `OTP_EXPIRED`, `OTP_RATE_LIMITED`, `OTP_TOO_MANY_ATTEMPTS`, `CART_EMPTY`, `SOLD_OUT`, `QTY_INVALID`, `PINCODE_UNSERVICEABLE`, `MIN_ORDER_NOT_MET`, `SLOT_FULL`, `SLOT_INVALID`, `SHOP_CLOSED`, `COUPON_INVALID`, `INVALID_TRANSITION`, `CANCEL_NOT_ALLOWED`, `PAYMENT_FAILED`, `INTERNAL` (see `src/lib/api.ts`).
