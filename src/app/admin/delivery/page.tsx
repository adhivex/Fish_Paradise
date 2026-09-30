import type { Metadata } from 'next';
import { DeliveryAdmin } from '@/components/admin/SimpleAdmins';

export const metadata: Metadata = { title: 'Delivery' };

export default function AdminDeliveryPage() {
  return <DeliveryAdmin />;
}
