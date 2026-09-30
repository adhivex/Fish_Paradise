import { z } from 'zod';

/** `GET /api/catalogue` and the Shop page URL share this schema. */
export const catalogueQuerySchema = z.object({
  category: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]{1,40}$/, 'Invalid category')
    .optional(),
  q: z.string().max(60).optional(),
  sort: z.enum(['rec', 'low', 'high', 'az']).optional(),
  priceBand: z
    .string()
    .regex(/^(any|b\d{1,2})$/, 'Invalid price band')
    .optional(),
});

export type CatalogueQuery = z.infer<typeof catalogueQuerySchema>;

export const productSlugSchema = z.string().regex(/^[a-z0-9-]{1,80}$/, 'Invalid product');

const id = z.string().min(1).max(40);

export const cartItemSchema = z.object({
  productId: id,
  qtyGrams: z.number().int().min(1).max(100_000),
  cleaningOptionId: id,
  lineNote: z.string().trim().max(200).nullish(),
});

export const cartBodySchema = z.object({
  items: z.array(cartItemSchema).max(50),
  notes: z.string().max(500).optional(),
  couponCode: z.string().trim().max(24).nullish(),
});

export const quoteBodySchema = z.object({
  items: z.array(cartItemSchema).max(50),
  couponCode: z.string().trim().max(24).nullish(),
  addressId: id.nullish(),
});

export const slotChoiceSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('ASAP') }),
  z.object({
    type: z.literal('SCHEDULED'),
    templateId: id,
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }),
]);

export const pincodeSchema = z
  .string()
  .trim()
  .regex(/^[1-9]\d{5}$/, 'Enter a valid 6-digit pincode');
