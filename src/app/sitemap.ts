import type { MetadataRoute } from 'next';
import { getCatalogue } from '@/server/services/catalogue';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const { products, categories } = await getCatalogue();
  const now = new Date();
  const page = (
    path: string,
    priority: number,
    changeFrequency: 'daily' | 'weekly' | 'monthly' = 'daily',
  ) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  });
  return [
    page('/', 1),
    page('/shop', 0.9),
    ...categories.map((c) => page(`/shop?category=${c.slug}`, 0.7)),
    ...products.map((p) => page(`/product/${p.slug}`, 0.8)),
    page('/about', 0.3, 'monthly'),
    page('/help', 0.3, 'monthly'),
    page('/contact', 0.3, 'monthly'),
    page('/privacy', 0.1, 'monthly'),
    page('/terms', 0.1, 'monthly'),
    page('/refund-policy', 0.1, 'monthly'),
  ];
}
