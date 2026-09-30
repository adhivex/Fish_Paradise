import type { Metadata } from 'next';
import { CouponsAdmin } from '@/components/admin/SimpleAdmins';

export const metadata: Metadata = { title: 'Coupons' };

export default function AdminCouponsPage() {
  return <CouponsAdmin />;
}
