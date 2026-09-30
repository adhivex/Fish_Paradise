import type { Metadata } from 'next';
import { CheckoutScreen } from '@/components/features/checkout/CheckoutScreen';

export const metadata: Metadata = { title: 'Checkout' };

export default function CheckoutPage() {
  return <CheckoutScreen />;
}
