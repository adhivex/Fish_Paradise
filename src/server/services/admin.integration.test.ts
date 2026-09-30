import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { db } from '@/server/db';

vi.mock('next/cache', () => ({ unstable_cache: <T>(fn: T) => fn, revalidateTag: vi.fn() }));

const admin = await import('./admin');

/** Admin operations against the database (migrated + seeded). Restores everything it changes. */
let adminId: string;
let pomfret: { id: string; pricePerKgPaise: number; todayAvailable: boolean; stockGrams: number | null };

beforeAll(async () => {
  const u = await db.user.upsert({
    where: { phone: '+916000000055' },
    update: { role: 'ADMIN' },
    create: { phone: '+916000000055', role: 'ADMIN', name: 'Test Admin' },
  });
  adminId = u.id;
  const p = await db.product.findUniqueOrThrow({ where: { slug: 'pomfret' } });
  pomfret = {
    id: p.id,
    pricePerKgPaise: p.pricePerKgPaise,
    todayAvailable: p.todayAvailable,
    stockGrams: p.stockGrams,
  };
});

afterAll(async () => {
  await db.product.update({
    where: { id: pomfret.id },
    data: {
      pricePerKgPaise: pomfret.pricePerKgPaise,
      todayAvailable: pomfret.todayAvailable,
      stockGrams: pomfret.stockGrams,
    },
  });
  await db.productPrice.deleteMany({ where: { setById: adminId } });
  await db.product.deleteMany({ where: { slug: 'itest-product' } });
  await db.category.deleteMany({ where: { slug: 'itest-cat' } });
  await db.coupon.deleteMany({ where: { code: 'ITESTADMIN' } });
  await db.user.delete({ where: { id: adminId } });
  await db.$disconnect();
});

describe('admin catalogue', () => {
  it('bulk-updates price, availability and stock and records price history', async () => {
    const res = await admin.bulkUpdateCatalogue(adminId, {
      updates: [{ id: pomfret.id, pricePerKgPaise: 70000, todayAvailable: false, stockGrams: 5000 }],
    });
    expect(res).toEqual({ updated: 1, priceChanges: 1 });
    const p = await db.product.findUniqueOrThrow({ where: { id: pomfret.id } });
    expect(p).toMatchObject({ pricePerKgPaise: 70000, todayAvailable: false, stockGrams: 5000 });
    const history = await db.productPrice.findFirstOrThrow({
      where: { productId: pomfret.id, setById: adminId },
      orderBy: { effectiveFrom: 'desc' },
    });
    expect(history.pricePerKgPaise).toBe(70000);
  });

  it('does not write history when only availability changes', async () => {
    const before = await db.productPrice.count({ where: { productId: pomfret.id } });
    await admin.bulkUpdateCatalogue(adminId, { updates: [{ id: pomfret.id, todayAvailable: true }] });
    expect(await db.productPrice.count({ where: { productId: pomfret.id } })).toBe(before);
  });
});

describe('admin entities', () => {
  it('refuses to delete a category that still has products, and deletes unused products', async () => {
    const cat = await admin.categories.create({
      name: 'Itest',
      slug: 'itest-cat',
      sortOrder: 99,
      isActive: false,
    });
    const p = await admin.createProduct(adminId, {
      name: 'Itest product',
      slug: 'itest-product',
      categoryId: cat.id,
      note: null,
      description: null,
      imageUrl: null,
      pricePerKgPaise: 10000,
      minQtyGrams: 500,
      stepGrams: 500,
      maxQtyGrams: 20000,
      todayAvailable: true,
      stockGrams: null,
      isFeatured: false,
      isActive: false,
      sortOrder: 99,
    });
    await expect(admin.categories.remove(cat.id)).rejects.toMatchObject({ code: 'CONFLICT' });
    expect(await admin.deleteProduct(p.id)).toEqual({ hidden: false });
    await admin.categories.remove(cat.id);
  });

  it('rejects duplicate slugs and codes with a friendly conflict', async () => {
    await expect(
      admin.categories.create({ name: 'Fish again', slug: 'fish', sortOrder: 0, isActive: true }),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
    await admin.coupons.create({
      code: 'ITESTADMIN',
      description: null,
      type: 'FLAT',
      value: 1000,
      minSubtotalPaise: 0,
      maxDiscountPaise: null,
      startsAt: null,
      endsAt: null,
      totalUsageLimit: null,
      perUserLimit: null,
      isActive: true,
    });
    await expect(
      admin.coupons.create({
        code: 'ITESTADMIN',
        description: null,
        type: 'FLAT',
        value: 1000,
        minSubtotalPaise: 0,
        maxDiscountPaise: null,
        startsAt: null,
        endsAt: null,
        totalUsageLimit: null,
        perUserLimit: null,
        isActive: true,
      }),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
  });

  it('requires a reason to cancel', async () => {
    await expect(admin.changeOrderStatus(adminId, 'missing', 'CANCELLED', null)).rejects.toMatchObject({
      code: 'VALIDATION',
    });
  });

  it('refuses to sign uploads without Cloudinary config', () => {
    expect(() => admin.signUpload()).toThrow(/not configured/);
  });
});
