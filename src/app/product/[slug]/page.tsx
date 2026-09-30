import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductDetail } from '@/components/features/product/ProductDetail';
import { getCatalogue } from '@/server/services/catalogue';

/** Pre-render every active product; new products render on first request. */
export async function generateStaticParams() {
  const { products } = await getCatalogue();
  return products.map((p) => ({ slug: p.slug }));
}

async function findProduct(slug: string) {
  const { products } = await getCatalogue();
  return products.find((p) => p.slug === slug);
}

export async function generateMetadata({ params }: PageProps<'/product/[slug]'>): Promise<Metadata> {
  const product = await findProduct((await params).slug);
  return product
    ? { title: product.name, description: `${product.name} – ${product.note ?? 'fresh seafood'}` }
    : {};
}

export default async function ProductPage({ params }: PageProps<'/product/[slug]'>) {
  const product = await findProduct((await params).slug);
  if (!product) notFound();
  return <ProductDetail product={product} />;
}
