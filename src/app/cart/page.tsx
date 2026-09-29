import type { Metadata } from 'next';
import { CartScreen } from '@/components/features/cart/CartScreen';

export const metadata: Metadata = { title: 'Your cart' };

export default function CartPage() {
  return <CartScreen />;
}
