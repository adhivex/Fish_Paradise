import type { Metadata } from 'next';
import { StaticPage } from '@/components/features/StaticPage';

export const metadata: Metadata = { title: 'Offers & rewards' };

export default function OffersPage() {
  return (
    <StaticPage title="Offers & rewards">
      <h2>No offers right now</h2>
      <p>Coupons and rewards will appear here. Keep an eye out for seasonal specials on the fresh catch.</p>
    </StaticPage>
  );
}
