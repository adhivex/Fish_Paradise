import { PrismaClient } from '@prisma/client';
import {
  seedCategories,
  seedCleaningOptions,
  seedDeliveryZones,
  seedProducts,
  seedShopSettings,
  seedSlotTemplates,
} from './seed-data';

const prisma = new PrismaClient();

async function main() {
  for (const c of seedCategories) {
    await prisma.category.upsert({ where: { slug: c.slug }, update: {}, create: c });
  }
  const cat = Object.fromEntries((await prisma.category.findMany()).map((c) => [c.slug, c.id]));

  let order = 1;
  for (const p of seedProducts) {
    const categoryId = cat[p.category];
    if (!categoryId) throw new Error(`Unknown category ${p.category}`);
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        slug: p.slug,
        name: p.name,
        categoryId,
        note: p.note,
        pricePerKgPaise: p.pricePerKgPaise,
        isFeatured: p.isFeatured,
        sortOrder: order++,
        priceHistory: { create: { pricePerKgPaise: p.pricePerKgPaise } },
      },
    });
  }

  for (const o of seedCleaningOptions) {
    await prisma.cleaningOption.upsert({ where: { label: o.label }, update: {}, create: o });
  }

  for (const z of seedDeliveryZones) {
    await prisma.deliveryZone.upsert({ where: { pincode: z.pincode }, update: {}, create: z });
  }

  // Only create slot templates on an empty table so admin edits survive a re-seed.
  if ((await prisma.slotTemplate.count()) === 0) {
    await prisma.slotTemplate.createMany({ data: seedSlotTemplates });
  }

  await prisma.shopSettings.upsert({ where: { id: 'shop' }, update: {}, create: seedShopSettings });

  // Admin user from env
  const adminPhone = process.env.ADMIN_PHONE;
  if (adminPhone) {
    await prisma.user.upsert({
      where: { phone: adminPhone },
      update: { role: 'ADMIN' },
      create: { phone: adminPhone, name: 'Shop Admin', role: 'ADMIN' },
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
