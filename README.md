# Fish Paradise

Online seafood store: a mobile-first web app for customers (fish, prawns and crab by weight, cleaned to
order, delivery slots, UPI/card/net banking or cash on delivery) plus a mobile-friendly admin panel for the
shop owner.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS 4 · Zustand ·
Supabase Postgres + Prisma 6 · Zod · Vitest · Playwright · pnpm.

## Status

| Phase | Scope                                               | State |
| ----- | --------------------------------------------------- | ----- |
| 0     | Scaffold, tooling, CI, design tokens, Prisma        | Done  |
| 1     | Design system + all customer screens with mock data | Done  |
| 2     | Database & catalogue API (Supabase)                 | Done  |
| 3     | Phone + OTP authentication                          | Next  |
| 4–10  | Server cart, orders & payments, admin, PWA, launch  | –     |

See `docs/BUILD_PLAN.md`.

## Run it locally

Requirements: Node 20+ and pnpm 9 (`npm i -g pnpm@9`).

1. Set up the database (next section) so `.env` has `DATABASE_URL` and `DIRECT_URL`.
2. Install, migrate, seed and start:

```bash
pnpm install
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Open http://localhost:3000 and use the browser's device toolbar at 390px width. Products, prices,
availability, categories, cleaning options and shop settings come from the database (cached for up to
a minute under the `catalogue` tag). Cart, orders, favourites and addresses are still client-side mocks
in `localStorage` until Phases 3–5 (clear site data to reset).

### Checks

```bash
pnpm lint && pnpm typecheck && pnpm test   # unit + route-handler tests (Vitest, no DB needed)
pnpm test:integration                      # catalogue service against the DB in .env
pnpm e2e                                   # Playwright; PW_CHANNEL=msedge pnpm e2e to use installed Edge
pnpm build
```

## Database (Supabase)

1. Create a Supabase project (region close to your customers, e.g. Mumbai `ap-south-1`).
2. **Project Settings → Database → Connection string**:
   - _Transaction pooler_ (port 6543) → `DATABASE_URL`, append `?pgbouncer=true&connection_limit=1`
   - _Session pooler / direct_ (port 5432) → `DIRECT_URL` (used by migrations)
3. `cp .env.example .env` and paste both URLs.
4. `pnpm db:migrate` then `pnpm db:seed`.

`docker-compose.yml` (`pnpm db:up`) is an optional offline fallback: point both URLs at
`postgresql://fish:fish@localhost:5432/fishparadise`.

## Project layout

| Path                            | Purpose                                                          |
| ------------------------------- | ---------------------------------------------------------------- |
| `src/app`                       | Routes (Home, Shop, Product, Cart, Checkout, Payment, Orders, …) |
| `src/components/ui`             | Design-system components (Button, OptionCard, BottomSheet, …)    |
| `src/components/features`       | Screen-level components                                          |
| `src/lib`                       | Money, quantity, pricing, filters, order timeline + tests        |
| `src/lib/stores`                | Zustand client stores (cart, account, orders, ui)                |
| `src/server`                    | Server-only code (Prisma client; services from Phase 2)          |
| `prisma/`                       | Schema and seed                                                  |
| `docs/`                         | PRD, design system, data model, API, build plan                  |
| `design/prototype/Main.dc.html` | Approved UI reference (not shipped)                              |
| `prompts/`, `.claude/commands/` | Build prompts and slash commands for Claude Code                 |

## Placeholders to replace before launch

Sample prices, the delivery pincode `751030` (Khandagiri sample), the sample customer and address, shop
phone/WhatsApp, FSSAI number, shop address and the refund policy. These are marked `PLACEHOLDER` in code
and highlighted on the Help and About pages.
