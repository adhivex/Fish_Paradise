# Launch checklist – Fish Paradise

Status legend: ✅ done in code · 🟡 placeholder in the app (owner must supply) · ⬜ to do at launch (needs accounts / approvals).

## 1. Business facts (owner)

| Item                                           | Status                                        | Where                                                               |
| ---------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------- |
| Real products, photos and today's prices       | 🟡 seed uses sample prices from the design    | Admin → Products (photos via Cloudinary), Admin → Today's catalogue |
| Shop phone and WhatsApp                        | 🟡 empty ("Call shop" is disabled until set)  | Admin → Settings                                                    |
| FSSAI licence number (14 digits)               | 🟡 empty                                      | Admin → Settings (shown in footer/About once set)                   |
| GSTIN (if registered)                          | 🟡 empty                                      | Admin → Settings                                                    |
| Shop address                                   | 🟡 placeholder text                           | `src/app/(store)/about`, `contact` pages                            |
| Delivery pincodes, fees, minimum order         | 🟡 one sample zone `751030`                   | Admin → Delivery                                                    |
| Delivery slots and daily capacity              | 🟡 three sample slots                         | Admin → Delivery                                                    |
| Opening hours, ASAP window, price-filter bands | 🟡 defaults 07:00–20:00, 30–60 min, ₹300/₹600 | Admin → Settings                                                    |
| City shown on Home ("Deliver to …")            | 🟡 sample "Bhubaneswar"                       | Admin → Settings                                                    |
| Privacy, Terms, Refund & cancellation texts    | 🟡 drafts with highlighted gaps               | `/privacy`, `/terms`, `/refund-policy` – have them reviewed         |
| Grievance officer contact (privacy)            | 🟡 placeholder                                | `/privacy`                                                          |

## 2. Accounts, keys and approvals

| Item                                 | Status | Notes                                                                                                                                                                                                                                              |
| ------------------------------------ | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Supabase project (Mumbai region)     | ⬜     | Put pooled URL (6543, `?pgbouncer=true&connection_limit=1`) in `DATABASE_URL`, direct/session URL (5432) in `DIRECT_URL`                                                                                                                           |
| `AUTH_SECRET`                        | ⬜     | `openssl rand -base64 32`; required in production                                                                                                                                                                                                  |
| `CRON_SECRET`                        | ⬜     | Random string; Vercel Cron sends it as a Bearer token                                                                                                                                                                                              |
| Razorpay live keys                   | ⬜     | `PAYMENT_PROVIDER=razorpay`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` (test keys first)                                                                                                                                                            |
| Razorpay webhook                     | ⬜     | Dashboard → Webhooks → URL `https://<domain>/api/webhooks/razorpay`, events `payment.captured`, `payment.failed`, `order.paid`; secret → `RAZORPAY_WEBHOOK_SECRET`                                                                                 |
| MSG91 OTP with DLT-approved template | ⬜     | `OTP_PROVIDER=msg91`, `MSG91_AUTH_KEY`, `MSG91_TEMPLATE_ID`, `MSG91_SENDER_ID` (DLT registration of entity, header and template is mandatory in India)                                                                                             |
| WhatsApp templates approved          | ⬜     | Names match `src/lib/notify/templates.ts`: `order_placed_owner`, `order_confirmed`, `order_out_for_delivery`, `order_delivered`, `order_cancelled`; set `NOTIFY_PROVIDER=whatsapp`, `WHATSAPP_API_URL`, `WHATSAPP_API_TOKEN`, `OWNER_NOTIFY_PHONE` |
| Cloudinary                           | ⬜     | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (admin photo uploads)                                                                                                                                                       |
| Sentry (optional)                    | ⬜     | `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`                                                                                                                                                                                                             |
| Admin phone                          | ⬜     | `ADMIN_PHONE=+91…` – that number becomes ADMIN on first login                                                                                                                                                                                      |
| Domain + SSL                         | ⬜     | Vercel domain; set `NEXT_PUBLIC_APP_URL=https://<domain>` (enables HSTS + upgrade-insecure-requests)                                                                                                                                               |

## 3. Deploy (Vercel + Supabase)

1. Import the repo in Vercel (region `bom1` is set in `vercel.json`). Add all env vars above for Production.
2. The build runs `pnpm vercel-build` = `prisma generate && prisma migrate deploy && next build`. Migrations apply automatically; **the seed never runs in production**.
3. First deploy only: insert real data via the admin panel (or run `pnpm db:seed` once against a staging DB, never production).
4. Vercel Cron (`vercel.json`) calls `/api/cron/expire-unpaid` every 10 minutes (needs a plan that allows it; otherwise use an external scheduler with the same Bearer header).
5. Log in with `ADMIN_PHONE`, open `/admin/settings`, fill the shop details, then `/admin/catalogue`.

## 4. Pre-launch verification

- [ ] `pnpm lint && pnpm typecheck && pnpm test && pnpm test:integration && pnpm build` green; CI green (includes Playwright).
- [ ] Razorpay **test mode** order: pay → webhook confirms order; replay the webhook from the dashboard → no duplicate effect.
- [ ] COD order → admin moves it Confirmed → Cleaning → Out for delivery → Delivered; customer gets WhatsApp/SMS at each step.
- [ ] Cancel a paid test order → "Refund due" in admin → refund in Razorpay → "Refund done".
- [ ] Unpaid online order is auto-cancelled after 30 minutes.
- [ ] OTP arrives by SMS within seconds; wrong code 5× locks; resend cooldown works.
- [ ] Unserviceable pincode blocks checkout with a clear message.
- [ ] Lighthouse (mobile, production URL): Performance ≥ 85, Accessibility ≥ 95; PWA installs from Chrome on Android.
- [ ] Security headers present (`curl -I https://<domain>`): CSP, HSTS, X-Frame-Options, nosniff.
- [ ] Supabase: point-in-time recovery / daily backups enabled; test a restore to a branch.
- [ ] Sentry receives a test error (if enabled).

## 5. Operations

- **Morning routine:** Admin → Today's catalogue → set prices, availability (and stock if tracked) → Save. The shop updates immediately.
- **Orders:** Admin → Orders (auto-refreshes every 15 s; tick "Sound alert" once per session). Advance each order; cancel with a reason (customer is notified).
- **Refunds:** paid orders that are cancelled show "Refund due"; refund in the Razorpay dashboard, then press "Refund done in Razorpay".
- **Pause orders:** Admin → Settings → "Taking orders" switch.
- **Logs:** structured JSON lines (`event` field: `order.*`, `payment.*`, `webhook.*`, `notify.*`, `otp.*`) in Vercel logs; notification attempts are also listed on each order.
