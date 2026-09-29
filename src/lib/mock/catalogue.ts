/**
 * In-memory mock catalogue for Phase 1. Mirrors `prisma/seed.ts` exactly (same slugs, prices,
 * notes, featured flags). Replaced by `GET /api/catalogue` in Phase 2.
 *
 * PLACEHOLDERS: prices are sample values from the design; delivery zone, city and shop contact
 * details are not real business facts and must be replaced by the shop.
 */
import { rupees } from '@/lib/money';
import type {
  AddressDTO,
  CategoryDTO,
  CleaningOptionDTO,
  DeliveryZoneDTO,
  ProductDTO,
  ShopSettingsDTO,
  SlotTemplateDTO,
} from '@/lib/types';

export const categories: CategoryDTO[] = [
  { id: 'cat_fish', slug: 'fish', name: 'Fish', sortOrder: 1 },
  { id: 'cat_prawns', slug: 'prawns', name: 'Prawns', sortOrder: 2 },
  { id: 'cat_crab', slug: 'crab', name: 'Crab', sortOrder: 3 },
];

const seedProducts: Array<{
  slug: string;
  name: string;
  c: string;
  price: number;
  note: string;
  featured?: boolean;
}> = [
  { slug: 'rohu', name: 'Rohu', c: 'fish', price: 320, note: 'Freshly sourced today', featured: true },
  { slug: 'pomfret', name: 'Pomfret', c: 'fish', price: 650, note: 'Freshly sourced today', featured: true },
  { slug: 'seer-fish', name: 'Seer Fish', c: 'fish', price: 720, note: 'Fresh & tasty' },
  { slug: 'tilapia', name: 'Tilapia', c: 'fish', price: 280, note: 'Fresh & clean' },
  { slug: 'hilsa', name: 'Hilsa (Ilish)', c: 'fish', price: 580, note: 'Seasonal catch' },
  { slug: 'mackerel', name: 'Mackerel', c: 'fish', price: 250, note: 'Local catch' },
  { slug: 'tiger-prawns', name: 'Tiger Prawns', c: 'prawns', price: 780, note: 'Large size', featured: true },
  { slug: 'white-prawns', name: 'White Prawns', c: 'prawns', price: 520, note: 'Medium size' },
  { slug: 'crab', name: 'Crab', c: 'crab', price: 420, note: 'Fresh & cleaned', featured: true },
];

export const products: ProductDTO[] = seedProducts.map((p, i) => ({
  id: `prod_${p.slug}`,
  slug: p.slug,
  name: p.name,
  categorySlug: p.c,
  note: p.note,
  description: null,
  imageUrl: null,
  pricePerKgPaise: rupees(p.price),
  minQtyGrams: 500,
  stepGrams: 500,
  maxQtyGrams: 20000,
  todayAvailable: true,
  stockGrams: null,
  isFeatured: !!p.featured,
  sortOrder: i + 1,
}));

/** Order of the "Today's fresh catch" rail, as in the approved design. */
export const featuredOrder = ['pomfret', 'tiger-prawns', 'rohu', 'crab'];

/** Product used as the artwork for each category tile. */
export const categoryCover: Record<string, string> = {
  fish: 'rohu',
  prawns: 'tiger-prawns',
  crab: 'crab',
};

export const cleaningOptions: CleaningOptionDTO[] = [
  {
    id: 'clean_whole',
    label: 'Whole cleaned',
    requiresNote: false,
    extraPaise: 0,
    isDefault: true,
    sortOrder: 1,
  },
  {
    id: 'clean_curry',
    label: 'Curry cut',
    requiresNote: false,
    extraPaise: 0,
    isDefault: false,
    sortOrder: 2,
  },
  { id: 'clean_fry', label: 'Fry cut', requiresNote: false, extraPaise: 0, isDefault: false, sortOrder: 3 },
  {
    id: 'clean_custom',
    label: 'Custom cut',
    requiresNote: true,
    extraPaise: 0,
    isDefault: false,
    sortOrder: 4,
  },
];

/** PLACEHOLDER zone from the design – replace with the shop's real delivery areas. */
export const deliveryZones: DeliveryZoneDTO[] = [
  {
    pincode: '751030',
    areaName: 'Khandagiri (sample)',
    deliveryFeePaise: rupees(40),
    freeAbovePaise: null,
    minOrderPaise: 0,
  },
];

export const slotTemplates: SlotTemplateDTO[] = [
  { id: 'slot_morning', label: '9:00 – 10:00 AM', startTime: '09:00', endTime: '10:00' },
  { id: 'slot_noon', label: '12:00 – 1:00 PM', startTime: '12:00', endTime: '13:00' },
  { id: 'slot_evening', label: '5:00 – 6:00 PM', startTime: '17:00', endTime: '18:00' },
];

/** PLACEHOLDER shop settings – phone, WhatsApp and FSSAI are filled in admin later. */
export const shopSettings: ShopSettingsDTO = {
  shopName: 'Fish Paradise',
  phone: null,
  whatsapp: null,
  fssaiNumber: null,
  opensAt: '07:00',
  closesAt: '20:00',
  acceptingOrders: true,
  asapMinMinutes: 30,
  asapMaxMinutes: 60,
  autoConfirmCod: true,
  priceBandsPaise: [rupees(300), rupees(600)],
  cityLabel: 'Bhubaneswar',
};

/** Sample address from the design (PLACEHOLDER). */
export const sampleAddresses: AddressDTO[] = [
  {
    id: 'addr_home',
    label: 'Home',
    line1: 'Plot No. 123',
    area: 'Khandagiri',
    city: 'Bhubaneswar',
    state: 'Odisha',
    pincode: '751030',
    isDefault: true,
  },
];

/** Sample signed-in customer from the design (PLACEHOLDER until OTP login in Phase 3). */
export const sampleCustomer = { name: 'Rahul Sharma', email: 'rahul@example.com', phone: '+91 00000 00000' };

export function getProduct(slug: string): ProductDTO | undefined {
  return products.find((p) => p.slug === slug);
}

export function getProductById(id: string): ProductDTO | undefined {
  return products.find((p) => p.id === id);
}

export function defaultCleaningOption(): CleaningOptionDTO {
  return cleaningOptions.find((o) => o.isDefault) ?? cleaningOptions[0]!;
}

export function findZone(pincode: string): DeliveryZoneDTO | undefined {
  return deliveryZones.find((z) => z.pincode === pincode.trim());
}
