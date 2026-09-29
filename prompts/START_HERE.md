# Paste this into Claude Code (first message)

You are building **Fish Paradise**, an online seafood store: a mobile-first PWA for customers plus a mobile-friendly admin panel for the shop owner.

## Read first (in this order)

1. `CLAUDE.md` – stack, rules, commands, definition of done
2. `docs/PRD.md` – scope, flows, business rules
3. `docs/DESIGN_SYSTEM.md` – tokens, components, screen notes
4. `docs/DATA_MODEL.md`, `prisma/schema.prisma`, `prisma/seed.ts`
5. `docs/API.md` and `docs/BUILD_PLAN.md`
6. `design/prototype/Main.dc.html` – the approved UI. It is a reference for markup, CSS and interaction logic; it cannot run standalone, so re-implement it properly in React components and Tailwind rather than copying it.

## Your task now

Do **Phase 0** and **Phase 1** from `docs/BUILD_PLAN.md`:

**Phase 0 – Scaffold:** create the Next.js (App Router, TypeScript strict) + Tailwind project in this folder without deleting the existing docs, prisma, design or prompts folders. Configure pnpm, ESLint, Prettier, Vitest, Playwright, `next/font` (Fraunces + DM Sans), Prisma client, the package scripts listed in `CLAUDE.md`, and a CI workflow. Apply the Tailwind theme tokens from `docs/DESIGN_SYSTEM.md`.

**Phase 1 – Customer UI with mock data:** build the reusable UI components and all 10 screens (Home, Shop with the floating Filter button and bottom sheet, Product, Cart, Checkout, Payment, Order confirmed, Tracking, My orders, Account) so the whole flow works end to end using an in-memory mock catalogue that mirrors `prisma/seed.ts`. Match the prototype visually at 390px: colours, typography, radii, spacing, and states. Cart state lives in a small client store.

## How to work

- Start by writing a short plan (folder structure, component list, routes) and wait for nothing; then execute it.
- Money in paise and weight in grams from day one (utility functions `formatMoney`, `formatQty` with unit tests).
- Keep components small and accessible (44px touch targets, aria-labels on icon buttons, focus-trapped bottom sheet, contrast 4.5:1).
- No real business facts: keep placeholders for phone, FSSAI, addresses and delivery areas.
- Run `pnpm lint && pnpm typecheck && pnpm test` before finishing; check the UI at 390px and 768px.
- Commit in small steps with conventional messages.

## When done, reply with

1. What you built and the routes/components created
2. Anything placeholder or mocked
3. How I can run and check it manually (exact commands)
4. Proposed next step (Phase 2)
