import { seedCategories, seedCleaningOptions, seedProducts, seedShopSettings } from '../../prisma/seed-data';
import { toShopSettingsDTO } from '@/lib/catalogue';
import type { CatalogueDTO } from '@/lib/types';

/** The seeded catalogue as DTOs, with predictable ids (`prod_<slug>`, `clean_<n>`). */
export function fixtureCatalogue(): CatalogueDTO {
  return {
    categories: seedCategories.map((c) => ({ id: `cat_${c.slug}`, ...c })),
    products: seedProducts.map((p, i) => ({
      id: `prod_${p.slug}`,
      slug: p.slug,
      name: p.name,
      categorySlug: p.category,
      note: p.note,
      description: null,
      imageUrl: null,
      pricePerKgPaise: p.pricePerKgPaise,
      minQtyGrams: 500,
      stepGrams: 500,
      maxQtyGrams: 20000,
      todayAvailable: true,
      stockGrams: null,
      isFeatured: p.isFeatured,
      sortOrder: i + 1,
    })),
    cleaningOptions: seedCleaningOptions.map((o, i) => ({ id: `clean_${i + 1}`, extraPaise: 0, ...o })),
    shop: toShopSettingsDTO({
      ...seedShopSettings,
      shopName: 'Fish Paradise',
      phone: null,
      whatsapp: null,
      fssaiNumber: null,
      gstin: null,
      opensAt: '07:00',
      closesAt: '20:00',
      acceptingOrders: true,
      asapMinMinutes: 30,
      asapMaxMinutes: 60,
      autoConfirmCod: true,
      unpaidCancelMinutes: 30,
    }),
  };
}
