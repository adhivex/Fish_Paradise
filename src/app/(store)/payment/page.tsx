import type { Metadata } from 'next';
import { PaymentScreen } from '@/components/features/checkout/PaymentScreen';

export const metadata: Metadata = { title: 'Payment' };

export default function PaymentPage() {
  return <PaymentScreen />;
}
