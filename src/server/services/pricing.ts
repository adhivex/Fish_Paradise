import 'server-only';
import type { Prisma, PrismaClient } from '@prisma/client';
import { quoteCart, type CartLine, type CartQuote } from '@/lib/cart';
import { normalizeCouponCode } from '@/lib/coupons';
import type { CleaningOptionDTO, DeliveryZoneDTO, ProductDTO } from '@/lib/types';
import { db } from '@/server/db';

type Tx = PrismaClient | Prisma.TransactionClient;

const PRODUCT_INCLUDE = { category: { select: { slug: true, isActive: true } } } as const;

/** Live product rows (never the cached catalogue): prices here are what gets charged. */
export async function loadProducts(tx: Tx, ids: string[]): Promise<Map<string, ProductDTO>> {
  const rows = await tx.product.findMany({ where: { id: { in: ids } }, include: PRODUCT_INCLUDE });
  const map = new Map<string, ProductDTO>();
  for (const p of rows) {
    if (!p.isActive || !p.category.isActive) continue;
    map.set(p.id, {
      id: p.id,
      slug: p.slug,
      name: p.name,
      categorySlug: p.category.slug,
      note: p.note,
      description: p.description,
      imageUrl: p.imageUrl,
      pricePerKgPaise: p.pricePerKgPaise,
      minQtyGrams: p.minQtyGrams,
      stepGrams: p.stepGrams,
      maxQtyGrams: p.maxQtyGrams,
      todayAvailable: p.todayAvailable,
      stockGrams: p.stockGrams,
      isFeatured: p.isFeatured,
      sortOrder: p.sortOrder,
    });
  }
  return map;
}

export async function loadCleaningOptions(tx: Tx = db): Promise<CleaningOptionDTO[]> {
  const rows = await tx.cleaningOption.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } });
  return rows.map((o) => ({
    id: o.id,
    label: o.label,
    requiresNote: o.requiresNote,
    extraPaise: o.extraPaise,
    isDefault: o.isDefault,
    sortOrder: o.sortOrder,
  }));
}

function toZoneDTO(z: {
  pincode: string;
  areaName: string;
  deliveryFeePaise: number;
  freeAbovePaise: number | null;
  minOrderPaise: number;
}): DeliveryZoneDTO {
  return {
    pincode: z.pincode,
    areaName: z.areaName,
    deliveryFeePaise: z.deliveryFeePaise,
    freeAbovePaise: z.freeAbovePaise,
    minOrderPaise: z.minOrderPaise,
  };
}

export async function findZone(pincode: string, tx: Tx = db): Promise<DeliveryZoneDTO | null> {
  const z = await tx.deliveryZone.findFirst({ where: { pincode: pincode.trim(), isActive: true } });
  return z ? toZoneDTO(z) : null;
}

/** Fee shown before an address is chosen: the lowest active zone fee. */
async function defaultZone(tx: Tx): Promise<DeliveryZoneDTO | null> {
  const z = await tx.deliveryZone.findFirst({
    where: { isActive: true },
    orderBy: { deliveryFeePaise: 'asc' },
  });
  return z ? toZoneDTO(z) : null;
}

export async function loadCoupon(code: string, userId: string | null, tx: Tx = db) {
  const normalized = normalizeCouponCode(code);
  const row = await tx.coupon.findUnique({ where: { code: normalized } });
  const userUses = row && userId ? await tx.couponUse.count({ where: { couponId: row.id, userId } }) : null;
  return { code: normalized, row, userUses };
}

export interface QuoteOptions {
  lines: readonly CartLine[];
  couponCode?: string | null;
  pincode?: string | null;
  userId: string | null;
  now?: Date;
}

/** Server-side price of any set of lines (guest or user, cart or order). */
export async function priceLines(
  opts: QuoteOptions,
  tx: Tx = db,
): Promise<CartQuote & { couponId: string | null }> {
  const [products, cleaning, zone, fallback, coupon] = await Promise.all([
    loadProducts(
      tx,
      opts.lines.map((l) => l.productId),
    ),
    loadCleaningOptions(tx),
    opts.pincode ? findZone(opts.pincode, tx) : Promise.resolve(null),
    defaultZone(tx),
    opts.couponCode ? loadCoupon(opts.couponCode, opts.userId, tx) : Promise.resolve(null),
  ]);
  const quote = quoteCart({
    lines: opts.lines,
    product: (id) => products.get(id),
    cleaning,
    pincode: opts.pincode ?? null,
    zone,
    defaultZone: fallback,
    coupon: coupon && { code: coupon.code, rule: coupon.row, userUses: coupon.userUses },
    now: opts.now ?? new Date(),
  });
  return { ...quote, couponId: quote.coupon?.applied ? (coupon?.row?.id ?? null) : null };
}
