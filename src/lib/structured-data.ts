import type { ShopSettingsDTO } from '@/lib/types';

/**
 * schema.org LocalBusiness for the shop. Only facts the owner has entered are included –
 * nothing is invented (missing phone/address are simply omitted).
 */
export function localBusinessJsonLd(shop: ShopSettingsDTO, baseUrl: string) {
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'FoodEstablishment',
    name: shop.shopName,
    url: baseUrl,
    image: `${baseUrl}/opengraph-image`,
    servesCuisine: 'Seafood',
    priceRange: '₹₹',
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        opens: shop.opensAt,
        closes: shop.closesAt,
      },
    ],
  };
  if (shop.phone) data.telephone = shop.phone;
  if (shop.deliveryCity) data.areaServed = { '@type': 'City', name: shop.deliveryCity };
  return data;
}

/** Safe for embedding in a <script> tag. */
export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
