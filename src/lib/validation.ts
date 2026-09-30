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
