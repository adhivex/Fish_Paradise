import type { Metadata } from 'next';
import { ConfirmedScreen } from '@/components/features/orders/ConfirmedScreen';

export const metadata: Metadata = { title: 'Order confirmed' };

export default async function ConfirmedPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;
  return <ConfirmedScreen orderNumber={orderNumber} />;
}
