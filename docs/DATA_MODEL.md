# Data Model Notes

Schema: `prisma/schema.prisma`. Money = integer paise, weight = integer grams.

## Entities

- **User / OtpCode** – phone-first identity. OTPs stored hashed with expiry (5 min) and attempt counter (max 5).
- **Address** – several per user, one default. `pincode` decides serviceability and fee via `DeliveryZone`.
- **Category / Product / ProductPrice** – products belong to one category. `pricePerKgPaise` is the live price; every change also writes a `ProductPrice` row (history, and who changed it).
  `todayAvailable` is the daily sold-out switch; `stockGrams` is optional stock tracking; `isFeatured` drives "Today's fresh catch".
- **CleaningOption** – Whole cleaned (default), Curry cut, Fry cut, Custom cut (requires a note). `extraPaise` is 0 in MVP.
- **Cart / CartItem** – one server cart per logged-in user; one line per product (`@@unique [cartId, productId]`); adding the same product adds grams and updates the cleaning option.
- **Favorite** – user ↔ product.
- **DeliveryZone** – per pincode: fee, optional free-above threshold, minimum order, active flag.
- **SlotTemplate** – scheduled windows with per-day capacity. ASAP is not a template; it is derived from `ShopSettings` and shop hours.
- **Coupon / CouponUse** – percent or flat; validity; global and per-user limits; `usedCount` incremented in the same transaction as order creation.
- **Order / OrderItem / OrderEvent / Payment** – see below.
- **WebhookEvent** – idempotency log for Razorpay webhooks (`@@unique [provider, eventId]`).
- **ShopSettings** – singleton row `id = "shop"`.

## Order creation (single transaction)

1. Load cart lines; re-check `isActive`, `todayAvailable`, min/step/max grams, stock.
2. Price each line: `lineTotal = round(pricePerKgPaise * qtyGrams / 1000)` (+ `extraPaise` if any).
3. Subtotal → coupon (revalidate) → delivery fee from zone (free-above rule) → total.
4. Validate slot (ASAP allowed only if shop open and `acceptingOrders`; scheduled slot has capacity).
5. Insert `Order` (+ `orderNumber = "FP" + (1000 + seq)`), `OrderItem` snapshots, `OrderEvent(PLACED)`, `CouponUse`; decrement stock if tracked; clear cart.
6. Online payment: create Razorpay order, insert `Payment(PENDING)`, return checkout params. COD: set `paymentStatus = COD_PENDING`, then confirm (auto or admin).

## Status transitions

```
PLACED → CONFIRMED → CLEANING_PACKING → OUT_FOR_DELIVERY → DELIVERED
PLACED | CONFIRMED | CLEANING_PACKING → CANCELLED
```

Implement as one `transitionOrder(orderId, to, actor, note)` service that validates the transition, writes `OrderEvent`, updates `Order.status`, and calls notifications. Nothing else may update `Order.status`.

## Rounding & display

Round line totals to the nearest paisa with `Math.round`. Display with `Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })` and strip `.00`.
Quantities: `< 1000 g → "500 g"`, otherwise kg with up to one decimal (`1 kg`, `1.5 kg`).

## Indexes & performance

Indexes exist on order lists (`userId, placedAt`; `status, placedAt`), product listing (`categoryId, isActive`) and price history. Cache the public catalogue (ISR / `revalidateTag('catalogue')`) and revalidate when admin updates prices or availability.
