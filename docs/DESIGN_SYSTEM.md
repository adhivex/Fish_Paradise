# Design System – Fish Paradise ("Deep sea & brass")

Premium, calm, mobile-first. Reference implementation: `design/prototype/Main.dc.html` (all screens, states and interactions).
Design width 390px. Content max-width on larger screens: 480px centred for the customer app; admin may use wider layouts.

## Colour tokens

| Token               | Hex                   | Use                                                                 |
| ------------------- | --------------------- | ------------------------------------------------------------------- |
| `ink`               | `#0A2A2F`             | Primary text, primary buttons, dark surfaces, hero                  |
| `ink-muted`         | `#4F6A6C`             | Secondary text                                                      |
| `cream`             | `#F7F2E8`             | App background                                                      |
| `card`              | `#FFFCF6`             | Cards, inputs, nav                                                  |
| `line`              | `#E6DCC8`             | Hairline borders (input border `#D9CCB1`, inner dividers `#EFE6D3`) |
| `gold`              | `#C9A45C`             | Accent on dark surfaces, icons, badges, current step                |
| `gold-dark`         | `#7A5C22`             | Accent text/links on light backgrounds                              |
| `gold-soft`         | `#F1E7D0`             | Selected option background, badges                                  |
| `gold-ink`          | `#5E4517`             | Text on gold-soft                                                   |
| `success-soft/text` | `#DCEBE6` / `#14574B` | Delivered pill                                                      |
| `danger`            | `#B3371A`             | Log out, destructive                                                |

Product image tiles (until real photos exist) use deep teal / warm-brown tones with a light glyph and gold hairline stroke.
Real photos should sit on the same rounded tile, with a subtle dark overlay if needed for contrast.

## Typography

- Display / names / prices / totals: **Fraunces** (600, tight tracking −0.2 to −1px). Load via `next/font/google`.
- UI / body: **DM Sans** (400–700).
- Scale (px): hero 42, page title 24, section title 24, product name 17–18 (serif), price 15–28, body 15, secondary 13, eyebrow/label 12 uppercase with 0.14–0.18em tracking.
- Minimum text size 12px.

## Shape, spacing, elevation

- Radii: cards 20–22, tiles 16–20, buttons 16 (pill 26 for hero CTA), chips 22 (pill), round icon buttons 50%.
- Screen padding 16px; card padding 14–18px; section spacing 24–30px.
- Shadow (cards): `0 14px 30px -22px rgba(10,42,47,.45)`; floating elements `0 16px 28px -10px rgba(10,42,47,.6)`.
- Icons: 1.5px stroke, rounded caps, 22px (Lucide is a good match).

## Tailwind theme (starting point)

```ts
// tailwind.config.ts (extend)
colors: {
  ink: { DEFAULT: '#0A2A2F', muted: '#4F6A6C' },
  cream: '#F7F2E8', card: '#FFFCF6',
  line: { DEFAULT: '#E6DCC8', strong: '#D9CCB1', soft: '#EFE6D3' },
  gold: { DEFAULT: '#C9A45C', dark: '#7A5C22', soft: '#F1E7D0', ink: '#5E4517' },
},
fontFamily: { serif: ['var(--font-fraunces)', 'Georgia', 'serif'], sans: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'] },
borderRadius: { card: '20px', tile: '18px' },
```

## Components to build (in `src/components/ui`)

Button (primary ink, gold, outline; sizes; full-width), IconButton (44px), Chip (selectable), OptionCard (radio-style: selected = ink border + gold-soft bg + inset ring),
Badge (count, gold), Pill (status), Card, Tile/ProductImage, QuantityStepper (500 g steps), SectionHeader (serif title + "View all"),
SearchInput, BottomNav (Home, Shop, Orders, Account; active = ink text + gold dot), FloatingFilterButton, BottomSheet (scrim, drag handle, focus trap, Esc/scrim closes),
Toast (ink, with "View cart" action; moves up on Shop screen to clear the filter button), Timeline (vertical: done = ink dot + gold check, current = gold dot, pending = outline),
EmptyState, Skeletons for every list.

## Screen notes (see prototype for exact layout)

1. **Home** – dark ink hero with gold line-art fish and waves, eyebrow "Fresh from the coast", serif headline, gold pill CTA "Shop now"; overlapping white feature strip (4 items, hairline dividers, gold-outlined icon circles); categories (3 dark tiles); horizontal "Today's fresh catch" cards with round add buttons.
2. **Shop** – header (back, title, cart with gold count badge), pill search, chip tabs, list rows (tile 76px, serif name, price, note, round add button). **Floating Filter button bottom-right** above the bottom nav with active-filter count; opens BottomSheet with Sort by (Recommended, price low→high, high→low, A–Z), Price per kg (Any, Under ₹300, ₹300–600, Above ₹600), Category; footer button "Show N items"; Reset link. Price bands should come from config.
3. **Product** – dark image panel 330px with round back/favourite buttons; cream sheet overlapping with 30px radius; serif name and price; badges; pill quantity stepper with round ink buttons; 2×2 cleaning options; dark delivery-estimate card; sticky "Add to cart · ₹650" bar.
4. **Cart** – line cards with tile, name, "₹/kg · cleaning", stepper, trash, line total; instructions textarea; dashed coupon row; totals card; sticky "Proceed to checkout". Empty state with CTA.
5. **Checkout** – three numbered cards (gold number on ink circle): Delivery address, Delivery slot, Order summary; sticky "Continue to payment".
6. **Payment** – total card, method OptionCards (UPI, Card, Net banking, Cash on delivery), CTA "Pay ₹1,080" (or "Place order" for COD), secure-payment note.
7. **Order confirmed** – large ink circle with gold check, serif "Order confirmed!", order card with dark ETA panel, "Track order" (ink) and "Continue shopping" (outline).
8. **Tracking** – vertical timeline, dark status card (headline + subline per stage), order lines and total, "Call shop" button (uses `ShopSettings.phone`).
9. **My orders** – status chips (All, Preparing, Out for delivery, Delivered), order cards with thumbnails, status pill, total; tap opens tracking.
10. **Account** – profile card, list (My orders, Saved addresses, Favourites, Offers & rewards, Help & support, About), log out.

## Interaction & accessibility rules

- Every icon-only control has `aria-label`; sheets are `role="dialog"` with focus trap and return focus.
- Selected states must not rely on colour alone (border + inset ring + radio dot).
- Respect `prefers-reduced-motion`; use short (150–250 ms) transitions only.
- Safe-area insets for bottom nav and sticky bars (`env(safe-area-inset-bottom)`).
- Loading = skeletons matching final layout; errors = inline message with retry.
- Copy tone: warm, short, confident. Currency `₹` with Indian grouping (`₹1,08,000` style via `Intl.NumberFormat('en-IN')`).
