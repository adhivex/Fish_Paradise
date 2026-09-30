import type { Metadata } from 'next';
import { Placeholder, StaticPage } from '@/components/features/StaticPage';
import { getCatalogue } from '@/server/services/catalogue';

export const metadata: Metadata = { title: 'Help & support' };

export default async function HelpPage() {
  const { shop } = await getCatalogue();
  return (
    <StaticPage title="Help & support">
      <h2>Contact the shop</h2>
      <p>
        Phone: {shop.phone ?? <Placeholder>Shop phone – to be added</Placeholder>}
        <br />
        WhatsApp: {shop.whatsapp ?? <Placeholder>WhatsApp number – to be added</Placeholder>}
      </p>
      <p>
        Open daily {shop.opensAt} – {shop.closesAt}.
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
