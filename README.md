# Fish Paradise

Online seafood store: a mobile-first web app for customers (fish, prawns and crab by weight, cleaned to
order, delivery slots, UPI/card/net banking or cash on delivery) plus a mobile-friendly admin panel for the
shop owner.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS 4 · Zustand ·
Supabase Postgres + Prisma 6 · Zod · Vitest · Playwright · pnpm.

## Status

| Phase | Scope                                                    | State |
| ----- | -------------------------------------------------------- | ----- |
| 0     | Scaffold, tooling, CI, design tokens, Prisma             | Done  |
| 1     | Design system + all customer screens with mock data      | Done  |
| 2     | Database & catalogue API (Supabase)                      | Next  |
| 3–10  | Auth, server cart, orders & payments, admin, PWA, launch | –     |

See `docs/BUILD_PLAN.md`.

## Run it locally

Requirements: Node 20+ and pnpm 9 (`npm i -g pnpm@9`).

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000 and use the browser's device toolbar at 390px width. Phase 1 runs entirely on
an in-memory mock catalogue (`src/lib/mock/catalogue.ts`, mirrors `prisma/seed.ts`); cart, orders,
favourites and addresses are stored in `localStorage` (clear site data to reset).

### Checks

```bash
pnpm lint && pnpm typecheck && pnpm test   # unit tests (Vitest)
pnpm e2e                                   # Playwright; PW_CHANNEL=msedge pnpm e2e to use installed Edge
pnpm build
```

## Database (Supabase) – needed from Phase 2

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
