import type { Metadata } from 'next';
import { AdminOrderDetail } from '@/components/admin/AdminOrderDetail';

export const metadata: Metadata = { title: 'Order' };

export default async function AdminOrderPage({ params }: PageProps<'/admin/orders/[id]'>) {
  const { id } = await params;
  return <AdminOrderDetail id={id} />;
}
