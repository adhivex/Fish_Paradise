# Fish Paradise – project memory

Online seafood store for a single shop, "Fish Paradise". Customers order fish, prawns and crab by weight,
choose how it is cleaned/cut, pick a delivery slot and pay (UPI/card/net banking via Razorpay, or cash on delivery).
The shop owner runs the business from a mobile-friendly admin panel. Primary users are on phones in India.

Read before coding: `docs/PRD.md`, `docs/DESIGN_SYSTEM.md`, `docs/DATA_MODEL.md`, `docs/API.md`, `docs/BUILD_PLAN.md`.
The approved UI reference is `design/prototype/Main.dc.html` (reference only, do not ship it).

## Stack (do not swap without asking)

- Next.js (App Router) + TypeScript (strict) + Tailwind CSS. PWA (manifest + service worker).
- **Supabase** Postgres + Prisma (`DATABASE_URL` pooled on 6543 for the app, `DIRECT_URL` on 5432 for migrations). `docker-compose.yml` is an optional offline fallback only.
- Auth: phone number + OTP, session via Auth.js (Credentials) or an equivalent signed httpOnly cookie. OTP sent through an adapter: `console` in dev, MSG91 in production.
- Payments: Razorpay Orders API + webhook. Cash on delivery handled in our own order flow.
- Images: Cloudinary (upload from admin, transform on delivery).
- Validation: Zod on every API input. Tests: Vitest (unit/integration), Playwright (e2e).
- Package manager: pnpm. Node LTS.

## Commands (create these scripts in Phase 0)

- `pnpm dev` – dev server
- `pnpm db:up` – optional local Postgres (docker compose) · `pnpm db:migrate` · `pnpm db:seed` · `pnpm db:studio`
- `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm test:integration` (needs DB) · `pnpm e2e` · `pnpm build`

## Non-negotiable rules

1. **Money** is always integer **paise** (₹1 = 100). Weight is always integer **grams**. Never floats. Format only at the UI edge (`₹1,080`, `1.5 kg`, `500 g`).
2. **Server is the source of truth for prices.** The client sends product ids + grams + cleaning option; the server re-prices everything (cart, checkout, coupons, delivery fee). Never trust client totals.
3. **Snapshot on order:** copy product name, price per kg, cleaning label and the delivery address into the order. Later price changes must not alter past orders.
4. **Payments:** an order is marked paid only from the verified Razorpay **webhook** (signature check + idempotency table). Never from the browser redirect alone.
5. **Order status** changes only through one function that writes an `OrderEvent`, enforces the allowed transitions, and triggers notifications.
6. **Admin routes** require `role = ADMIN` in middleware and again in each handler.
7. **Mobile first.** Design at 390px width; touch targets at least 44px; text contrast at least 4.5:1; real `<button>`/`<a>`/`<label>` elements; visible focus; support `prefers-reduced-motion`.
8. No secrets in the repo. Read config from env; keep `.env.example` current.
9. No `any`. No unused exports. Small components, colocated tests for business logic (pricing, status transitions, coupon rules, webhook handling).
10. Do not invent business facts (phone, FSSAI number, delivery areas, prices). Put placeholders in `ShopSettings` / seed and flag them in your summary.

## Conventions

- Folders: `src/app` (routes), `src/components` (ui + feature), `src/lib` (pricing, money, auth, razorpay, otp, notify), `src/server` (services), `prisma/`.
- Business logic lives in `src/server/services/*` and `src/lib/*`, not in route handlers or components.
- Route handlers: parse with Zod → call service → return typed JSON `{ data }` or `{ error: { code, message } }`.
- Commit small, conventional messages (`feat:`, `fix:`, `chore:`). One phase = one branch/PR-sized chunk.

## Definition of done (every task)

`pnpm lint && pnpm typecheck && pnpm test` pass · UI checked at 390px and 768px · no console errors · docs updated if behaviour changed · short summary of what changed, what is placeholder, and what to verify manually.

## Windows/WSL2 note

Keep the repo inside the WSL2 filesystem (`~/…`), not under `/mnt/c`, for speed and to avoid filling the C drive with caches. Prune Docker regularly (`docker system prune`).
