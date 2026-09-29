import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const rupees = (n: number) => n * 100;

async function main() {
  // Categories
  const cats = [
    { slug: 'fish', name: 'Fish', sortOrder: 1 },
    { slug: 'prawns', name: 'Prawns', sortOrder: 2 },
    { slug: 'crab', name: 'Crab', sortOrder: 3 },
  ];
  for (const c of cats) {
    await prisma.category.upsert({ where: { slug: c.slug }, update: {}, create: c });
  }
  const cat = Object.fromEntries((await prisma.category.findMany()).map((c) => [c.slug, c.id]));

  // Sample products (prices are SAMPLE values from the design; shop must replace them)
  const products = [
    { slug: 'rohu', name: 'Rohu', c: 'fish', price: 320, note: 'Freshly sourced today', featured: true },
    {
      slug: 'pomfret',
      name: 'Pomfret',
      c: 'fish',
      price: 650,
      note: 'Freshly sourced today',
      featured: true,
    },
    { slug: 'seer-fish', name: 'Seer Fish', c: 'fish', price: 720, note: 'Fresh & tasty' },
    { slug: 'tilapia', name: 'Tilapia', c: 'fish', price: 280, note: 'Fresh & clean' },
    { slug: 'hilsa', name: 'Hilsa (Ilish)', c: 'fish', price: 580, note: 'Seasonal catch' },
    { slug: 'mackerel', name: 'Mackerel', c: 'fish', price: 250, note: 'Local catch' },
    {
      slug: 'tiger-prawns',
      name: 'Tiger Prawns',
      c: 'prawns',
      price: 780,
      note: 'Large size',
      featured: true,
    },
    { slug: 'white-prawns', name: 'White Prawns', c: 'prawns', price: 520, note: 'Medium size' },
    { slug: 'crab', name: 'Crab', c: 'crab', price: 420, note: 'Fresh & cleaned', featured: true },
  ];
  let order = 1;
  for (const p of products) {
    const categoryId = cat[p.c];
    if (!categoryId) throw new Error(`Unknown category ${p.c}`);
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        slug: p.slug,
        name: p.name,
        categoryId,
        note: p.note,
        pricePerKgPaise: rupees(p.price),
        isFeatured: !!p.featured,
        sortOrder: order++,
        priceHistory: { create: { pricePerKgPaise: rupees(p.price) } },
      },
    });
  }

  // Cleaning options
  const cleaning = [
    { label: 'Whole cleaned', isDefault: true, sortOrder: 1 },
    { label: 'Curry cut', sortOrder: 2 },
    { label: 'Fry cut', sortOrder: 3 },
    { label: 'Custom cut', requiresNote: true, sortOrder: 4 },
  ];
  for (const o of cleaning) {
    await prisma.cleaningOption.upsert({ where: { label: o.label }, update: {}, create: o });
  }

  // Delivery zone (PLACEHOLDER pincode from the design; replace with the shop's real areas)
  await prisma.deliveryZone.upsert({
    where: { pincode: '751030' },
    update: {},
    create: { pincode: '751030', areaName: 'Khandagiri (sample)', deliveryFeePaise: rupees(40) },
  });

  // Slot templates
  const slots = [
    { label: '9:00 – 10:00 AM', startTime: '09:00', endTime: '10:00', sortOrder: 1 },
    { label: '12:00 – 1:00 PM', startTime: '12:00', endTime: '13:00', sortOrder: 2 },
    { label: '5:00 – 6:00 PM', startTime: '17:00', endTime: '18:00', sortOrder: 3 },
  ];
  await prisma.slotTemplate.deleteMany();
  await prisma.slotTemplate.createMany({ data: slots });

  // Shop settings (fill real values in admin)
  await prisma.shopSettings.upsert({
    where: { id: 'shop' },
    update: {},
    create: { id: 'shop', priceBandsPaise: [rupees(300), rupees(600)] },
  });

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
