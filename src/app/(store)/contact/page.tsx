import type { Metadata } from 'next';
import { Placeholder, StaticPage } from '@/components/features/StaticPage';
import { formatPhone } from '@/lib/phone';
import { getCatalogue } from '@/server/services/catalogue';

export const metadata: Metadata = { title: 'Contact' };

export default async function ContactPage() {
  const { shop } = await getCatalogue();
  return (
    <StaticPage title="Contact us" backHref="/">
      <h2>{shop.shopName}</h2>
      <p>
        Phone:{' '}
        {shop.phone ? (
          <a className="text-gold-dark font-semibold underline" href={`tel:${shop.phone}`}>
            {formatPhone(shop.phone)}
          </a>
        ) : (
          <Placeholder>Shop phone – set in Admin → Settings</Placeholder>
        )}
      </p>
      <p>
        WhatsApp:{' '}
        {shop.whatsapp ? (
          <a
            className="text-gold-dark font-semibold underline"
            href={`https://wa.me/${shop.whatsapp.replace('+', '')}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {formatPhone(shop.whatsapp)}
          </a>
        ) : (
          <Placeholder>WhatsApp number – set in Admin → Settings</Placeholder>
        )}
      </p>
      <p>
        Open daily {shop.opensAt} – {shop.closesAt}.
      </p>
      <p>
        Address: <Placeholder>Shop address – to be added</Placeholder>
      </p>
      {shop.fssaiNumber && <p>FSSAI Lic. No. {shop.fssaiNumber}</p>}
    </StaticPage>
  );
}
