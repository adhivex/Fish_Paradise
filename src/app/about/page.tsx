import type { Metadata } from 'next';
import { Placeholder, StaticPage } from '@/components/features/StaticPage';
import { shopSettings } from '@/lib/mock/catalogue';

export const metadata: Metadata = { title: 'About' };

export default function AboutPage() {
  return (
    <StaticPage title="About Fish Paradise">
      <h2>Fresh from the coast</h2>
      <p>
        {shopSettings.shopName} brings the day&apos;s catch to your door – fish, prawns and crab, cleaned and
        cut the way you like, packed hygienically and delivered fast.
      </p>
      <h2>Licences</h2>
      <p>
        FSSAI licence: {shopSettings.fssaiNumber ?? <Placeholder>FSSAI number – to be added</Placeholder>}
      </p>
      <p>
        Address: <Placeholder>Shop address – to be added</Placeholder>
      </p>
    </StaticPage>
  );
}
