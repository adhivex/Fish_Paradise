import type { Metadata } from 'next';
import { TrackingScreen } from '@/components/features/orders/TrackingScreen';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}): Promise<Metadata> {
  const { orderNumber } = await params;
  return { title: `Order #${orderNumber}` };
}

export default async function TrackingPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;
  return <TrackingScreen orderNumber={orderNumber} />;
}
