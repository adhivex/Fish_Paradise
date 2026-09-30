import type { Metadata } from 'next';
import { OrdersQueue } from '@/components/admin/OrdersQueue';

export const metadata: Metadata = { title: 'Orders' };

export default function AdminOrdersPage() {
  return <OrdersQueue />;
}
