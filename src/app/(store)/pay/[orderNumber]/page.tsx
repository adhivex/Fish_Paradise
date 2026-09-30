import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { FakePaymentScreen } from '@/components/features/checkout/FakePaymentScreen';
import { env } from '@/lib/env';

export const metadata: Metadata = { title: 'Test payment', robots: { index: false } };

/** Local stand-in for Razorpay Checkout (PAYMENT_PROVIDER=fake, never in production). */
export default async function FakePayPage({ params }: PageProps<'/pay/[orderNumber]'>) {
  if (env().NODE_ENV === 'production' || env().PAYMENT_PROVIDER !== 'fake') notFound();
  const { orderNumber } = await params;
  return <FakePaymentScreen orderNumber={orderNumber} />;
}
