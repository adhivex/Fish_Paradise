import type { Metadata } from 'next';
import { ProductsAdmin } from '@/components/admin/ProductsAdmin';

export const metadata: Metadata = { title: 'Products' };

export default function AdminProductsPage() {
  return <ProductsAdmin />;
}
