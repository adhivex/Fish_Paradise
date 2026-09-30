import 'server-only';
import { unstable_cache } from 'next/cache';
import type { Prisma } from '@prisma/client';
import { toShopSettingsDTO } from '@/lib/catalogue';
import type { CatalogueDTO, ProductDTO } from '@/lib/types';
import { db } from '@/server/db';

type ProductRow = Prisma.ProductGetPayload<{ include: { category: { select: { slug: true } } } }>;

function toProductDTO(p: ProductRow): ProductDTO {
  return {
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
  };
}

async function loadCatalogue(): Promise<CatalogueDTO> {
  const [categories, products, cleaning, settings] = await Promise.all([
    db.category.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] }),
    db.product.findMany({
      where: { isActive: true, category: { isActive: true } },
      include: { category: { select: { slug: true } } },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    }),
    db.cleaningOption.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
    db.shopSettings.findUnique({ where: { id: 'shop' } }),
  ]);
  return {
    categories: categories.map((c) => ({ id: c.id, slug: c.slug, name: c.name, sortOrder: c.sortOrder })),
    products: products.map(toProductDTO),
    cleaningOptions: cleaning.map((o) => ({
      id: o.id,
      label: o.label,
      requiresNote: o.requiresNote,
      extraPaise: o.extraPaise,
      isDefault: o.isDefault,
      sortOrder: o.sortOrder,
    })),
    shop: toShopSettingsDTO(settings),
  };
}

/**
 * Public catalogue from the database, cached under the `catalogue` tag. Admin price and
 * availability updates revalidate the tag (Phase 7); otherwise it is at most a minute stale.
 * Checkout never trusts it: orders are re-priced from the database (Phase 4/5).
 */
export const getCatalogue = unstable_cache(loadCatalogue, ['catalogue-v1'], {
  tags: ['catalogue'],
  revalidate: 60,
});
