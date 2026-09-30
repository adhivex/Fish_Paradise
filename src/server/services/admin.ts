import 'server-only';
import { createHash } from 'node:crypto';
import { revalidateTag } from 'next/cache';
import type { OrderStatus, Prisma } from '@prisma/client';
import type { z } from 'zod';
import { ApiError } from '@/lib/api';
import type {
  catalogueBulkSchema,
  categorySchema,
  cleaningOptionSchema,
  couponSchema,
  productSchema,
  settingsSchema,
  slotSchema,
  zoneSchema,
} from '@/lib/admin-schemas';
import { env } from '@/lib/env';
import { istParts, istToDate } from '@/lib/ist';
import { log } from '@/lib/log';
import type { AddressDTO } from '@/lib/types';
import { db } from '@/server/db';
import { transitionOrder } from '@/server/services/orders';

/** Storefront pages and the cached catalogue refresh immediately after admin changes. */
export function revalidateCatalogue() {
  try {
    revalidateTag('catalogue', { expire: 0 });
  } catch (err) {
    log.warn('admin.revalidate_failed', { err });
  }
}

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === 'object' && err !== null && 'code' in err && (err as { code: string }).code === 'P2002'
  );
}

async function guardUnique<T>(fn: () => Promise<T>, message: string): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (isUniqueViolation(err)) throw new ApiError('CONFLICT', message, 409);
    throw err;
  }
}

// ------------------------------------------------------------------ Today's catalogue

export async function listAdminCatalogue() {
  const products = await db.product.findMany({
    include: { category: { select: { name: true } } },
    orderBy: [{ category: { sortOrder: 'asc' } }, { sortOrder: 'asc' }, { name: 'asc' }],
  });
  return products.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    categoryName: p.category.name,
    categoryId: p.categoryId,
    pricePerKgPaise: p.pricePerKgPaise,
    todayAvailable: p.todayAvailable,
    stockGrams: p.stockGrams,
    isActive: p.isActive,
    isFeatured: p.isFeatured,
    imageUrl: p.imageUrl,
    note: p.note,
    description: p.description,
    minQtyGrams: p.minQtyGrams,
    stepGrams: p.stepGrams,
    maxQtyGrams: p.maxQtyGrams,
    sortOrder: p.sortOrder,
  }));
}

/** Bulk price / availability / stock update; every price change is recorded in ProductPrice. */
export async function bulkUpdateCatalogue(adminId: string, input: z.infer<typeof catalogueBulkSchema>) {
  const ids = input.updates.map((u) => u.id);
  const current = new Map((await db.product.findMany({ where: { id: { in: ids } } })).map((p) => [p.id, p]));
  let priceChanges = 0;
  await db.$transaction(async (tx) => {
    for (const u of input.updates) {
      const before = current.get(u.id);
      if (!before) throw new ApiError('NOT_FOUND', 'Product not found.', 404);
      await tx.product.update({
        where: { id: u.id },
        data: {
          pricePerKgPaise: u.pricePerKgPaise,
          todayAvailable: u.todayAvailable,
          stockGrams: u.stockGrams,
        },
      });
      if (u.pricePerKgPaise !== undefined && u.pricePerKgPaise !== before.pricePerKgPaise) {
        priceChanges++;
        await tx.productPrice.create({
          data: { productId: u.id, pricePerKgPaise: u.pricePerKgPaise, setById: adminId },
        });
      }
    }
  });
  revalidateCatalogue();
  log.info('admin.catalogue_bulk', { adminId, updated: input.updates.length, priceChanges });
  return { updated: input.updates.length, priceChanges };
}

// ------------------------------------------------------------------ Products

export async function createProduct(adminId: string, data: z.infer<typeof productSchema>) {
  const p = await guardUnique(
    () =>
      db.product.create({
        data: {
          ...data,
          priceHistory: { create: { pricePerKgPaise: data.pricePerKgPaise, setById: adminId } },
        },
      }),
    'A product with this slug already exists.',
  );
  revalidateCatalogue();
  return p;
}

export async function updateProduct(
  adminId: string,
  id: string,
  data: Partial<z.infer<typeof productSchema>>,
) {
  const before = await db.product.findUnique({ where: { id } });
  if (!before) throw new ApiError('NOT_FOUND', 'Product not found.', 404);
  const p = await guardUnique(
    () => db.product.update({ where: { id }, data }),
    'A product with this slug already exists.',
  );
  if (data.pricePerKgPaise !== undefined && data.pricePerKgPaise !== before.pricePerKgPaise) {
    await db.productPrice.create({
      data: { productId: id, pricePerKgPaise: data.pricePerKgPaise, setById: adminId },
    });
  }
  revalidateCatalogue();
  return p;
}

/** Products that were ever ordered are hidden (isActive=false) instead of deleted. */
export async function deleteProduct(id: string) {
  const used = await db.orderItem.count({ where: { productId: id } });
  if (used > 0) {
    await db.product.update({ where: { id }, data: { isActive: false } });
    await db.cartItem.deleteMany({ where: { productId: id } });
  } else {
    await db.$transaction([
      db.cartItem.deleteMany({ where: { productId: id } }),
      db.favorite.deleteMany({ where: { productId: id } }),
      db.product.delete({ where: { id } }),
    ]);
  }
  revalidateCatalogue();
  return { hidden: used > 0 };
}

// ------------------------------------------------------------------ Simple entities

export const categories = {
  list: () => db.category.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] }),
  create: async (data: z.infer<typeof categorySchema>) => {
    const c = await guardUnique(
      () => db.category.create({ data }),
      'A category with this slug already exists.',
    );
    revalidateCatalogue();
    return c;
  },
  update: async (id: string, data: Partial<z.infer<typeof categorySchema>>) => {
    const c = await guardUnique(() => db.category.update({ where: { id }, data }), 'Slug already in use.');
    revalidateCatalogue();
    return c;
  },
  remove: async (id: string) => {
    if ((await db.product.count({ where: { categoryId: id } })) > 0) {
      throw new ApiError(
        'CONFLICT',
        'Move or delete this category’s products first (or hide the category).',
        409,
      );
    }
    await db.category.delete({ where: { id } });
    revalidateCatalogue();
  },
};

async function onlyOneDefaultCleaning(tx: Prisma.TransactionClient, keepId: string) {
  await tx.cleaningOption.updateMany({ where: { id: { not: keepId } }, data: { isDefault: false } });
}

export const cleaningOptions = {
  list: () => db.cleaningOption.findMany({ orderBy: { sortOrder: 'asc' } }),
  create: async (data: z.infer<typeof cleaningOptionSchema>) => {
    const o = await guardUnique(
      () =>
        db.$transaction(async (tx) => {
          const created = await tx.cleaningOption.create({ data });
          if (data.isDefault) await onlyOneDefaultCleaning(tx, created.id);
          return created;
        }),
      'An option with this label already exists.',
    );
    revalidateCatalogue();
    return o;
  },
  update: async (id: string, data: Partial<z.infer<typeof cleaningOptionSchema>>) => {
    const o = await db.$transaction(async (tx) => {
      const updated = await tx.cleaningOption.update({ where: { id }, data });
      if (data.isDefault) await onlyOneDefaultCleaning(tx, id);
      return updated;
    });
    revalidateCatalogue();
    return o;
  },
  remove: async (id: string) => {
    // Options referenced by carts are retired instead of deleted.
    if ((await db.cartItem.count({ where: { cleaningOptionId: id } })) > 0) {
      await db.cleaningOption.update({ where: { id }, data: { isActive: false, isDefault: false } });
    } else {
      await db.cleaningOption.delete({ where: { id } });
    }
    revalidateCatalogue();
  },
};

export const zones = {
  list: () => db.deliveryZone.findMany({ orderBy: { pincode: 'asc' } }),
  create: (data: z.infer<typeof zoneSchema>) =>
    guardUnique(() => db.deliveryZone.create({ data }), 'This pincode already has a zone.'),
  update: (id: string, data: Partial<z.infer<typeof zoneSchema>>) =>
    guardUnique(() => db.deliveryZone.update({ where: { id }, data }), 'This pincode already has a zone.'),
  remove: async (id: string) => {
    await db.deliveryZone.delete({ where: { id } });
  },
};

export const slots = {
  list: () => db.slotTemplate.findMany({ orderBy: [{ sortOrder: 'asc' }, { startTime: 'asc' }] }),
  create: (data: z.infer<typeof slotSchema>) => db.slotTemplate.create({ data }),
  update: (id: string, data: Partial<z.infer<typeof slotSchema>>) =>
    db.slotTemplate.update({ where: { id }, data }),
  remove: async (id: string) => {
    await db.slotTemplate.delete({ where: { id } });
  },
};

export const coupons = {
  list: () => db.coupon.findMany({ orderBy: [{ isActive: 'desc' }, { code: 'asc' }] }),
  create: (data: z.infer<typeof couponSchema>) =>
    guardUnique(() => db.coupon.create({ data }), 'A coupon with this code already exists.'),
  update: (id: string, data: Partial<z.infer<typeof couponSchema>>) =>
    guardUnique(() => db.coupon.update({ where: { id }, data }), 'A coupon with this code already exists.'),
  /** Used coupons are deactivated so order history keeps its reference. */
  remove: async (id: string) => {
    if (
      (await db.couponUse.count({ where: { couponId: id } })) > 0 ||
      (await db.order.count({ where: { couponId: id } })) > 0
    ) {
      await db.coupon.update({ where: { id }, data: { isActive: false } });
    } else {
      await db.coupon.delete({ where: { id } });
    }
  },
};

// ------------------------------------------------------------------ Settings

export async function getSettings() {
  return (
    (await db.shopSettings.findUnique({ where: { id: 'shop' } })) ??
    (await db.shopSettings.create({ data: { id: 'shop' } }))
  );
}

export async function updateSettings(data: z.infer<typeof settingsSchema>) {
  if (data.asapMaxMinutes < data.asapMinMinutes) {
    throw new ApiError('VALIDATION', 'ASAP max must be at least the min.');
  }
  if (data.closesAt <= data.opensAt)
    throw new ApiError('VALIDATION', 'Closing time must be after opening time.');
  const s = await db.shopSettings.upsert({
    where: { id: 'shop' },
    update: { ...data, priceBandsPaise: [...data.priceBandsPaise].sort((a, b) => a - b) },
    create: { id: 'shop', ...data },
  });
  revalidateCatalogue();
  return s;
}

// ------------------------------------------------------------------ Orders

const QUEUE: Record<string, OrderStatus[]> = {
  new: ['PLACED', 'CONFIRMED'],
  preparing: ['CLEANING_PACKING'],
  out: ['OUT_FOR_DELIVERY'],
  done: ['DELIVERED', 'CANCELLED'],
};

export type QueueName = keyof typeof QUEUE;

export async function listAdminOrders(queue: QueueName, date: string | null) {
  const where: Prisma.OrderWhereInput = { status: { in: QUEUE[queue] } };
  if (date) {
    where.placedAt = { gte: istToDate(date, '00:00'), lt: istToDate(date, '24:00') };
  } else if (queue === 'done') {
    where.placedAt = { gte: istToDate(istParts(new Date()).date, '00:00') };
  }
  const [orders, counts, refunds] = await Promise.all([
    db.order.findMany({
      where,
      include: { items: true, user: { select: { name: true, phone: true } } },
      orderBy: { placedAt: queue === 'done' ? 'desc' : 'asc' },
      take: 200,
    }),
    db.order.groupBy({
      by: ['status'],
      where: { status: { in: ['PLACED', 'CONFIRMED', 'CLEANING_PACKING', 'OUT_FOR_DELIVERY'] } },
      _count: { _all: true },
    }),
    db.order.count({ where: { paymentStatus: 'REFUND_PENDING' } }),
  ]);
  const count = (statuses: OrderStatus[]) =>
    counts.filter((c) => statuses.includes(c.status)).reduce((n, c) => n + c._count._all, 0);
  return {
    orders: orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      placedAt: o.placedAt.getTime(),
      slotLabel: o.slotLabel,
      slotStart: o.slotStart?.getTime() ?? null,
      totalPaise: o.totalPaise,
      customerName: o.user.name,
      customerPhone: o.user.phone,
      area:
        (o.addressSnapshot as unknown as AddressDTO).area ??
        (o.addressSnapshot as unknown as AddressDTO).city,
      items: o.items.map((i) => ({
        name: i.nameSnapshot,
        qtyGrams: i.qtyGrams,
        cleaningLabel: i.cleaningLabel,
      })),
    })),
    counts: { new: count(QUEUE.new!), preparing: count(QUEUE.preparing!), out: count(QUEUE.out!) },
    refundsPending: refunds,
  };
}

export async function getAdminOrder(id: string) {
  const o = await db.order.findUnique({
    where: { id },
    include: {
      items: true,
      events: { orderBy: { createdAt: 'asc' } },
      user: { select: { name: true, phone: true, email: true } },
      payments: { orderBy: { createdAt: 'desc' } },
      notifications: { orderBy: { createdAt: 'desc' }, take: 20 },
      coupon: { select: { code: true } },
    },
  });
  if (!o) throw new ApiError('NOT_FOUND', 'Order not found.', 404);
  return {
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status,
    paymentMethod: o.paymentMethod,
    paymentStatus: o.paymentStatus,
    placedAt: o.placedAt.getTime(),
    slotLabel: o.slotLabel,
    notes: o.notes,
    cancelReason: o.cancelReason,
    subtotalPaise: o.subtotalPaise,
    deliveryFeePaise: o.deliveryFeePaise,
    discountPaise: o.discountPaise,
    totalPaise: o.totalPaise,
    couponCode: o.coupon?.code ?? null,
    customer: o.user,
    address: o.addressSnapshot as unknown as AddressDTO,
    items: o.items.map((i) => ({
      id: i.id,
      name: i.nameSnapshot,
      pricePerKgPaise: i.pricePerKgPaise,
      qtyGrams: i.qtyGrams,
      cleaningLabel: i.cleaningLabel,
      lineNote: i.lineNote,
      lineTotalPaise: i.lineTotalPaise,
    })),
    events: o.events.map((e) => ({ status: e.status, at: e.createdAt.getTime(), note: e.note })),
    payments: o.payments.map((p) => ({
      id: p.id,
      status: p.status,
      amountPaise: p.amountPaise,
      razorpayOrderId: p.razorpayOrderId,
      razorpayPaymentId: p.razorpayPaymentId,
      failureReason: p.failureReason,
      at: p.createdAt.getTime(),
    })),
    notifications: o.notifications.map((n) => ({
      template: n.template,
      channel: n.channel,
      status: n.status,
      error: n.error,
      at: n.createdAt.getTime(),
    })),
  };
}

export async function changeOrderStatus(adminId: string, id: string, to: OrderStatus, note: string | null) {
  if (to === 'CANCELLED' && !note) throw new ApiError('VALIDATION', 'Please give a reason for cancelling.');
  await transitionOrder(id, to, { type: 'admin', userId: adminId }, note);
  return getAdminOrder(id);
}

/** Manual refunds in MVP: the owner refunds in the Razorpay dashboard, then marks it done here. */
export async function markRefunded(adminId: string, id: string) {
  const res = await db.order.updateMany({
    where: { id, paymentStatus: 'REFUND_PENDING' },
    data: { paymentStatus: 'REFUNDED' },
  });
  if (res.count === 0) throw new ApiError('CONFLICT', 'This order has no pending refund.', 409);
  await db.payment.updateMany({ where: { orderId: id, status: 'PAID' }, data: { status: 'REFUNDED' } });
  log.info('admin.refund_marked', { adminId, orderId: id });
  return getAdminOrder(id);
}

// ------------------------------------------------------------------ Uploads

/** Signed params for direct browser → Cloudinary uploads (the API secret never leaves the server). */
export function signUpload(folder = 'fish-paradise/products') {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = env();
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new ApiError('CONFLICT', 'Image uploads are not configured (set the CLOUDINARY_* variables).', 409);
  }
  const timestamp = Math.floor(Date.now() / 1000);
  const toSign = `folder=${folder}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`;
  return {
    cloudName: CLOUDINARY_CLOUD_NAME,
    apiKey: CLOUDINARY_API_KEY,
    timestamp,
    folder,
    signature: createHash('sha1').update(toSign).digest('hex'),
  };
}
