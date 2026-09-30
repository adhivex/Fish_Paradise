import type { Metadata } from 'next';
import { OrdersScreen } from '@/components/features/orders/OrdersScreen';

export const metadata: Metadata = { title: 'My orders' };

export default function OrdersPage() {
  return <OrdersScreen />;
}
