# Product Requirements – Fish Paradise

## 1. Goal

Let customers order fresh seafood from Fish Paradise on their phone in under two minutes, and let the shop owner manage
daily prices, stock and orders from a phone. Single shop, single city to start.

## 2. Users

- **Customer** – mobile web, Indian phone number, pays by UPI/card/net banking or cash on delivery.
- **Shop owner / staff (Admin)** – updates today's prices and availability, processes orders, contacts customers.

## 3. MVP scope (ship this first)

Customer app (PWA):

1. Home – hero, trust icons (fresh daily, hygienic cleaning, fast delivery, trusted quality), categories, today's fresh catch.
2. Shop – category tabs, search, product list, quick-add, **Filter** floating button (bottom-right) with sort, price band, category.
3. Product – price per kg, quantity in 500 g steps, cleaning preference, delivery estimate, favourite, add to cart.
4. Cart – edit quantities, remove, clear, special instructions, coupon field, subtotal/delivery/total.
5. Checkout – address (choose/add), delivery slot (ASAP or scheduled), order summary.
6. Payment – UPI / card / net banking (Razorpay) or cash on delivery.
7. Order confirmed → Order tracking (timeline) → My orders (filter by status) → Account.
8. Phone + OTP login (browse without login; login required at checkout).

Admin (protected `/admin`, mobile-friendly):

1. Today's catalogue: bulk update price per kg, mark available / sold out, set stock (optional).
2. Orders: new orders list, open order, advance status, cancel with reason, call/WhatsApp customer.
3. Products & categories CRUD with image upload.
4. Delivery: serviceable pincodes + fee, slot templates, accepting-orders switch.
5. Coupons CRUD.
6. Shop settings: name, phone, WhatsApp, FSSAI number, hours.

Notifications: WhatsApp (preferred) or SMS for order confirmed, out for delivery, delivered.

## 4. Later (not MVP)

Saved payment methods, loyalty/rewards, reviews & ratings, live rider location, multi-shop, subscriptions, native apps, Hindi/Odia UI.
Screens that exist in the prototype but are **visual only** in MVP: Offers & rewards, Help & support (static page with shop contact), About (static page).

## 5. Business rules

- **Units:** price per kg; quantity in grams, min 500, step 500, max 20 000 per line (configurable per product).
- **Cleaning options:** Whole cleaned (default), Curry cut, Fry cut, Custom cut (custom requires the notes field or a line note). Managed in admin; no extra charge in MVP (field exists for later).
- **Availability:** each product has `todayAvailable`. Sold-out items show a disabled "Sold out today" state and cannot be added. If stock is tracked (`stockGrams` not null), block quantities above stock and decrement on order confirmation.
- **Delivery fee:** from the delivery zone matching the address pincode; free above a configurable subtotal (optional). Unserviceable pincode = clear message at address step and checkout blocked.
- **Slots:** `ASAP` (30–60 min, only while shop is open and accepting orders) or scheduled from active slot templates with capacity per template per day.
- **Coupons:** percent or flat, min subtotal, max discount, validity window, total and per-user usage limits. Validated server-side at checkout and again at order creation.
- **Order number:** `FP` + (1000 + running sequence), e.g. `FP1024`.
- **Status flow:** `PLACED → CONFIRMED → CLEANING_PACKING → OUT_FOR_DELIVERY → DELIVERED`, plus `CANCELLED` from any state before `OUT_FOR_DELIVERY`. Customer timeline shows: Confirmed, Cleaning & packing, Out for delivery, Delivered.
- **Payment:** online orders are created `PLACED` with payment `PENDING`, and move to `CONFIRMED` when the webhook confirms payment. COD orders go to `CONFIRMED` immediately (or after admin confirmation if the shop prefers; setting in `ShopSettings`). Unpaid online orders auto-cancel after 30 minutes.
- **Cancellation:** customer can cancel before `CLEANING_PACKING`; admin any time before `OUT_FOR_DELIVERY`. Paid orders create a refund task for admin (manual Razorpay refund in MVP).
- **Guest cart:** kept in local storage; merged into the server cart on login.

## 6. Non-functional

- Mobile-first, works on low-end Android over 4G. Target Lighthouse mobile: Performance ≥ 85, Accessibility ≥ 95, PWA installable.
- Images via Cloudinary with responsive sizes and lazy loading; hero and first product row prioritised.
- Security: OTP rate limiting (per phone and per IP), OTP expiry 5 min, max 5 attempts; hashed OTPs; CSRF-safe cookies; input validation; admin authorisation; webhook signature verification.
- Privacy: store only what is needed (phone, name, addresses, orders). Provide privacy policy and terms pages (placeholders for the client to fill).
- Observability: Sentry, structured logs for payments/webhooks/notifications.
- Legal placeholders: FSSAI licence number, GSTIN (optional), refund/cancellation policy page.

## 7. Key user flows

**Order:** Home → Shop → Product → Add to cart → Cart → (login if needed) → Checkout (address, slot) → Payment → Confirmed → Track.
**Admin morning routine:** open `/admin/catalogue` → update today's prices and availability → done in under 2 minutes. This screen must be a fast, single-page list with inline editing.

## 8. Success metrics (for later analytics)

Checkout conversion, average order value, repeat-order rate, % orders paid online, time-to-confirm by shop.
