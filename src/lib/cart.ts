import { evaluateCoupon, type CouponRule } from '@/lib/coupons';
import { deliveryFeePaise, lineTotalPaise } from '@/lib/pricing';
import { clampQty, isValidQty, maxAllowedGrams } from '@/lib/qty';
import type { CleaningOptionDTO, DeliveryZoneDTO, ProductDTO } from '@/lib/types';

/** What the client keeps and sends to the server: ids + grams + cleaning. Never prices. */
export interface CartLine {
  productId: string;
  qtyGrams: number;
  cleaningOptionId: string;
  lineNote?: string | null;
}

/** Adds to an existing line (grams add up, cleaning option is replaced) or appends a new line. */
export function addLine(lines: readonly CartLine[], add: CartLine, product: ProductDTO): CartLine[] {
  const existing = lines.find((l) => l.productId === add.productId);
  if (!existing) return [...lines, { ...add, qtyGrams: clampQty(add.qtyGrams, product) }];
  return lines.map((l) =>
    l.productId === add.productId
      ? {
          ...l,
          qtyGrams: clampQty(l.qtyGrams + add.qtyGrams, product),
          cleaningOptionId: add.cleaningOptionId,
          lineNote: add.lineNote ?? l.lineNote ?? null,
        }
      : l,
  );
}

/** Guest cart merged into the server cart on login, one line per product. */
export function mergeLines(
  server: readonly CartLine[],
  guest: readonly CartLine[],
  product: (id: string) => ProductDTO | undefined,
): CartLine[] {
  let merged = [...server];
  for (const line of guest) {
    const p = product(line.productId);
    if (!p) continue;
    merged = addLine(merged, line, p);
  }
  return merged;
}

export type LineIssue = 'UNAVAILABLE' | 'SOLD_OUT' | 'QTY_INVALID' | 'NOTE_REQUIRED' | 'CLEANING_INVALID';

export interface QuotedLine {
  productId: string;
  slug: string;
  name: string;
  categorySlug: string;
  imageUrl: string | null;
  pricePerKgPaise: number;
  qtyGrams: number;
  minQtyGrams: number;
  stepGrams: number;
  maxAllowedGrams: number;
  cleaningOptionId: string;
  cleaningLabel: string;
  lineNote: string | null;
  lineTotalPaise: number;
  issue: LineIssue | null;
}

export type QuoteBlocker =
  | 'CART_EMPTY'
  | 'SOLD_OUT'
  | 'QTY_INVALID'
  | 'NOTE_REQUIRED'
  | 'PINCODE_UNSERVICEABLE'
  | 'MIN_ORDER_NOT_MET'
  | 'COUPON_INVALID';

export interface CartQuote {
  lines: QuotedLine[];
  subtotalPaise: number;
  discountPaise: number;
  deliveryFeePaise: number;
  totalPaise: number;
  coupon: { code: string; applied: boolean; message: string | null } | null;
  delivery: {
    pincode: string | null;
    serviceable: boolean | null;
    areaName: string | null;
    minOrderPaise: number;
    /** True when no address was given and the fee is an estimate from the default zone. */
    estimated: boolean;
  };
  blockers: Array<{ code: QuoteBlocker; message: string }>;
}

export interface QuoteInput {
  lines: readonly CartLine[];
  product: (id: string) => ProductDTO | undefined;
  cleaning: readonly CleaningOptionDTO[];
  /** Delivery pincode, if an address was chosen. */
  pincode: string | null;
  zone: DeliveryZoneDTO | null;
  /** Used to estimate the fee when no address is chosen yet. */
  defaultZone: DeliveryZoneDTO | null;
  coupon: { code: string; rule: CouponRule | null; userUses: number | null } | null;
  now: Date;
}

const ISSUE_MESSAGE: Record<LineIssue, string> = {
  UNAVAILABLE: 'is no longer available',
  SOLD_OUT: 'is sold out today',
  QTY_INVALID: 'is not available in that quantity',
  NOTE_REQUIRED: 'needs a note describing the custom cut',
  CLEANING_INVALID: 'has a cleaning option that is no longer offered',
};

/**
 * Prices a cart. Runs on the server for every cart view, checkout and order creation, so the
 * numbers the customer sees are exactly the numbers they are charged.
 */
export function quoteCart(input: QuoteInput): CartQuote {
  const lines: QuotedLine[] = input.lines.map((line) => {
    const p = input.product(line.productId);
    const option = input.cleaning.find((o) => o.id === line.cleaningOptionId);
    const note = line.lineNote?.trim() || null;
    let issue: LineIssue | null = null;
    if (!p) issue = 'UNAVAILABLE';
    else if (!p.todayAvailable || maxAllowedGrams(p) === 0) issue = 'SOLD_OUT';
    else if (!isValidQty(line.qtyGrams, p)) issue = 'QTY_INVALID';
    else if (!option) issue = 'CLEANING_INVALID';
    else if (option.requiresNote && !note) issue = 'NOTE_REQUIRED';
    return {
      productId: line.productId,
      slug: p?.slug ?? '',
      name: p?.name ?? 'Unavailable item',
      categorySlug: p?.categorySlug ?? '',
      imageUrl: p?.imageUrl ?? null,
      pricePerKgPaise: p?.pricePerKgPaise ?? 0,
      qtyGrams: line.qtyGrams,
      minQtyGrams: p?.minQtyGrams ?? 0,
      stepGrams: p?.stepGrams ?? 0,
      maxAllowedGrams: p ? maxAllowedGrams(p) : 0,
      cleaningOptionId: line.cleaningOptionId,
      cleaningLabel: option?.label ?? '—',
      lineNote: note,
      lineTotalPaise:
        issue || !p ? 0 : lineTotalPaise(p.pricePerKgPaise, line.qtyGrams, option?.extraPaise ?? 0),
      issue,
    };
  });

  const subtotal = lines.reduce((sum, l) => sum + l.lineTotalPaise, 0);

  let discount = 0;
  let coupon: CartQuote['coupon'] = null;
  if (input.coupon) {
    const result = evaluateCoupon(input.coupon.rule, {
      subtotalPaise: subtotal,
      now: input.now,
      userUses: input.coupon.userUses,
    });
    if (result.ok) discount = result.discountPaise;
    coupon = { code: input.coupon.code, applied: result.ok, message: result.ok ? null : result.message };
  }

  const zone = input.pincode ? input.zone : input.defaultZone;
  const serviceable = input.pincode ? !!input.zone : null;
  const fee = zone && serviceable !== false ? deliveryFeePaise(subtotal - discount, zone) : 0;

  const blockers: CartQuote['blockers'] = [];
  if (lines.length === 0) blockers.push({ code: 'CART_EMPTY', message: 'Your cart is empty.' });
  for (const l of lines) {
    if (!l.issue) continue;
    const code: QuoteBlocker =
      l.issue === 'NOTE_REQUIRED' ? 'NOTE_REQUIRED' : l.issue === 'QTY_INVALID' ? 'QTY_INVALID' : 'SOLD_OUT';
    blockers.push({ code, message: `${l.name} ${ISSUE_MESSAGE[l.issue]}.` });
  }
  if (serviceable === false) {
    blockers.push({ code: 'PINCODE_UNSERVICEABLE', message: `We don't deliver to ${input.pincode} yet.` });
  }
  const minOrder = zone?.minOrderPaise ?? 0;
  if (serviceable && lines.length > 0 && subtotal < minOrder) {
    blockers.push({
      code: 'MIN_ORDER_NOT_MET',
      message: `Minimum order for this area is ₹${(minOrder / 100).toLocaleString('en-IN')}.`,
    });
  }
  if (coupon && !coupon.applied) {
    blockers.push({ code: 'COUPON_INVALID', message: coupon.message ?? 'Remove the coupon to continue.' });
  }

  return {
    lines,
    subtotalPaise: subtotal,
    discountPaise: discount,
    deliveryFeePaise: fee,
    totalPaise: subtotal - discount + fee,
    coupon,
    delivery: {
      pincode: input.pincode,
      serviceable,
      areaName: input.pincode ? (input.zone?.areaName ?? null) : null,
      minOrderPaise: minOrder,
      estimated: !input.pincode,
    },
    blockers,
  };
}
