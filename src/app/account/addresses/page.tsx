import type { Metadata } from 'next';
import { AddressesScreen } from '@/components/features/account/AddressesScreen';

export const metadata: Metadata = { title: 'Saved addresses' };

export default function AddressesPage() {
  return <AddressesScreen />;
}
