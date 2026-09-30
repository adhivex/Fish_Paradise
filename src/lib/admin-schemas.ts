import { z } from 'zod';

/** Validation for every admin write (money in paise, weights in grams, times as HH:MM). */

const slug = z
  .string()
  .trim()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and dashes')
  .max(60);
const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:MM (24-hour)');
const paise = z.number().int().min(0).max(100_000_000);
const grams = z.number().int().min(50).max(100_000);
const nullableText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => (v ? v : null));

export const catalogueBulkSchema = z.object({
  updates: z
    .array(
      z.object({
        id: z.string().min(1).max(40),
        pricePerKgPaise: z.number().int().min(100).max(10_000_000).optional(),
        todayAvailable: z.boolean().optional(),
        stockGrams: z.number().int().min(0).max(10_000_000).nullable().optional(),
      }),
    )
    .min(1)
    .max(500),
});

export const productSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    slug,
    categoryId: z.string().min(1).max(40),
    note: nullableText(80),
    description: nullableText(1000),
    imageUrl: z
      .string()
      .url()
      .max(500)
      .nullish()
      .transform((v) => v ?? null),
    pricePerKgPaise: z.number().int().min(100).max(10_000_000),
    minQtyGrams: grams.default(500),
    stepGrams: grams.default(500),
    maxQtyGrams: grams.default(20_000),
    todayAvailable: z.boolean().default(true),
    stockGrams: z.number().int().min(0).nullable().default(null),
    isFeatured: z.boolean().default(false),
    isActive: z.boolean().default(true),
    sortOrder: z.number().int().min(0).max(10_000).default(0),
  })
  .refine((p) => p.maxQtyGrams >= p.minQtyGrams, {
    message: 'Max must be at least the minimum',
    path: ['maxQtyGrams'],
  });

export const categorySchema = z.object({
  name: z.string().trim().min(2).max(40),
  slug,
  sortOrder: z.number().int().min(0).max(10_000).default(0),
  isActive: z.boolean().default(true),
});

export const cleaningOptionSchema = z.object({
  label: z.string().trim().min(2).max(40),
  requiresNote: z.boolean().default(false),
  extraPaise: paise.default(0),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(10_000).default(0),
});

export const zoneSchema = z.object({
  pincode: z
    .string()
    .trim()
    .regex(/^[1-9]\d{5}$/, 'Enter a 6-digit pincode'),
  areaName: z.string().trim().min(2).max(60),
  deliveryFeePaise: paise,
  freeAbovePaise: paise.nullable().default(null),
  minOrderPaise: paise.default(0),
  isActive: z.boolean().default(true),
});

export const slotSchema = z
  .object({
    label: z.string().trim().min(3).max(40),
    startTime: hhmm,
    endTime: hhmm,
    capacity: z.number().int().min(0).max(1000),
    isActive: z.boolean().default(true),
    sortOrder: z.number().int().min(0).max(10_000).default(0),
  })
  .refine((s) => s.endTime > s.startTime, { message: 'End must be after start', path: ['endTime'] });

export const couponSchema = z
  .object({
    code: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9]{3,24}$/, 'Use 3–24 letters or digits'),
    description: nullableText(120),
    type: z.enum(['PERCENT', 'FLAT']),
    value: z.number().int().min(1).max(10_000_000),
    minSubtotalPaise: paise.default(0),
    maxDiscountPaise: paise.nullable().default(null),
    startsAt: z.coerce.date().nullable().default(null),
    endsAt: z.coerce.date().nullable().default(null),
    totalUsageLimit: z.number().int().min(1).nullable().default(null),
    perUserLimit: z.number().int().min(1).nullable().default(null),
    isActive: z.boolean().default(true),
  })
  .refine((c) => c.type !== 'PERCENT' || c.value <= 100, {
    message: 'Percent must be 1–100',
    path: ['value'],
  })
  .refine((c) => !c.startsAt || !c.endsAt || c.endsAt > c.startsAt, {
    message: 'End must be after start',
    path: ['endsAt'],
  });

const phone = z
  .string()
  .trim()
  .regex(/^\+91[6-9]\d{9}$/, 'Use +91 followed by 10 digits')
  .nullish()
  .transform((v) => v ?? null);

export const settingsSchema = z.object({
  shopName: z.string().trim().min(2).max(60),
  phone,
  whatsapp: phone,
  fssaiNumber: z
    .string()
    .trim()
    .regex(/^\d{14}$/, 'FSSAI licence numbers have 14 digits')
    .nullish()
    .transform((v) => v ?? null),
  gstin: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[0-9A-Z]{15}$/, 'GSTIN has 15 characters')
    .nullish()
    .transform((v) => v ?? null),
  opensAt: hhmm,
  closesAt: hhmm,
  acceptingOrders: z.boolean(),
  asapMinMinutes: z.number().int().min(5).max(600),
  asapMaxMinutes: z.number().int().min(5).max(600),
  autoConfirmCod: z.boolean(),
  unpaidCancelMinutes: z
    .number()
    .int()
    .min(5)
    .max(24 * 60),
  priceBandsPaise: z.array(z.number().int().min(100)).max(6),
  deliveryCity: nullableText(40),
});

export const orderStatusChangeSchema = z.object({
  to: z.enum(['CONFIRMED', 'CLEANING_PACKING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED']),
  note: z.string().trim().max(200).nullish(),
});
