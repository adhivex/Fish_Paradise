import type { Metadata } from 'next';
import { AccountScreen } from '@/components/features/account/AccountScreen';

export const metadata: Metadata = { title: 'My account' };

export default function AccountPage() {
  return <AccountScreen />;
}
