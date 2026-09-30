/**
 * Seed data – the single source for `prisma/seed.ts` and the unit-test fixtures.
 *
 * PLACEHOLDERS: prices are SAMPLE values from the design; the delivery zone, delivery city and
 * shop contact details are not real business facts. The shop replaces them in admin.
 */

const rupees = (n: number) => n * 100;

export const seedCategories = [
  { slug: 'fish', name: 'Fish', sortOrder: 1 },
  { slug: 'prawns', name: 'Prawns', sortOrder: 2 },
  { slug: 'crab', name: 'Crab', sortOrder: 3 },
];

export const seedProducts: Array<{
  slug: string;
  name: string;
  category: string;
  pricePerKgPaise: number;
  note: string;
  isFeatured: boolean;
}> = [
  {
    slug: 'rohu',
    name: 'Rohu',
    category: 'fish',
    pricePerKgPaise: rupees(320),
    note: 'Freshly sourced today',
    isFeatured: true,
  },
  {
    slug: 'pomfret',
    name: 'Pomfret',
    category: 'fish',
    pricePerKgPaise: rupees(650),
    note: 'Freshly sourced today',
    isFeatured: true,
  },
  {
    slug: 'seer-fish',
    name: 'Seer Fish',
    category: 'fish',
    pricePerKgPaise: rupees(720),
    note: 'Fresh & tasty',
    isFeatured: false,
  },
  {
    slug: 'tilapia',
    name: 'Tilapia',
    category: 'fish',
    pricePerKgPaise: rupees(280),
    note: 'Fresh & clean',
    isFeatured: false,
  },
  {
    slug: 'hilsa',
    name: 'Hilsa (Ilish)',
    category: 'fish',
    pricePerKgPaise: rupees(580),
    note: 'Seasonal catch',
    isFeatured: false,
  },
  {
    slug: 'mackerel',
    name: 'Mackerel',
    category: 'fish',
    pricePerKgPaise: rupees(250),
    note: 'Local catch',
    isFeatured: false,
  },
  {
    slug: 'tiger-prawns',
    name: 'Tiger Prawns',
    category: 'prawns',
    pricePerKgPaise: rupees(780),
    note: 'Large size',
    isFeatured: true,
  },
  {
    slug: 'white-prawns',
    name: 'White Prawns',
    category: 'prawns',
    pricePerKgPaise: rupees(520),
    note: 'Medium size',
    isFeatured: false,
  },
  {
    slug: 'crab',
    name: 'Crab',
    category: 'crab',
    pricePerKgPaise: rupees(420),
    note: 'Fresh & cleaned',
    isFeatured: true,
  },
];

export const seedCleaningOptions = [
  { label: 'Whole cleaned', requiresNote: false, isDefault: true, sortOrder: 1 },
  { label: 'Curry cut', requiresNote: false, isDefault: false, sortOrder: 2 },
  { label: 'Fry cut', requiresNote: false, isDefault: false, sortOrder: 3 },
  { label: 'Custom cut', requiresNote: true, isDefault: false, sortOrder: 4 },
];

/** PLACEHOLDER pincode from the design – replace with the shop's real areas. */
export const seedDeliveryZones = [
  { pincode: '751030', areaName: 'Khandagiri (sample)', deliveryFeePaise: rupees(40) },
];

export const seedSlotTemplates = [
  { label: '9:00 – 10:00 AM', startTime: '09:00', endTime: '10:00', sortOrder: 1 },
  { label: '12:00 – 1:00 PM', startTime: '12:00', endTime: '13:00', sortOrder: 2 },
  { label: '5:00 – 6:00 PM', startTime: '17:00', endTime: '18:00', sortOrder: 3 },
];

/** PLACEHOLDER: `deliveryCity` is the sample city from the design. Phone, WhatsApp and FSSAI stay empty. */
export const seedShopSettings = {
  id: 'shop',
  priceBandsPaise: [rupees(300), rupees(600)],
  deliveryCity: 'Bhubaneswar',
};
