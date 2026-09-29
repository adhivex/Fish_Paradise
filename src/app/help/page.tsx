import type { Metadata } from 'next';
import { Placeholder, StaticPage } from '@/components/features/StaticPage';
import { shopSettings } from '@/lib/mock/catalogue';

export const metadata: Metadata = { title: 'Help & support' };

export default function HelpPage() {
  return (
    <StaticPage title="Help & support">
      <h2>Contact the shop</h2>
      <p>
        Phone: {shopSettings.phone ?? <Placeholder>Shop phone – to be added</Placeholder>}
        <br />
        WhatsApp: {shopSettings.whatsapp ?? <Placeholder>WhatsApp number – to be added</Placeholder>}
      </p>
      <p>
        Open daily {shopSettings.opensAt} – {shopSettings.closesAt}.
      </p>
      <h2>Orders & delivery</h2>
      <p>
        Every order is cleaned and packed after you place it. You can cancel before cleaning starts from your
        order page, or call the shop.
      </p>
      <h2>Refunds</h2>
      <p>
        <Placeholder>Refund & cancellation policy – to be provided by the shop</Placeholder>
      </p>
    </StaticPage>
  );
}
