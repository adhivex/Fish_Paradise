import type { Metadata } from 'next';
import { Placeholder, StaticPage } from '@/components/features/StaticPage';

export const metadata: Metadata = { title: 'Terms of use' };

/** PLACEHOLDER legal text – the shop must have this reviewed and completed before launch. */
export default function TermsPage() {
  return (
    <StaticPage title="Terms of use" backHref="/">
      <p>
        <Placeholder>Draft – to be reviewed by the shop before launch</Placeholder>
      </p>
      <h2>Orders</h2>
      <p>
        Prices are per kg and may change daily. The price you see at checkout is the price you pay. Weights
        are before cleaning unless stated otherwise.
      </p>
      <h2>Availability</h2>
      <p>
        Seafood depends on the day&apos;s catch. If an item becomes unavailable after you order, we will
        contact you and refund or adjust the order.
      </p>
      <h2>Delivery</h2>
      <p>We deliver only to the areas shown at checkout, in the slot you choose.</p>
      <h2>Business details</h2>
      <p>
        <Placeholder>Legal entity name, address, FSSAI and GSTIN – to be added</Placeholder>
      </p>
    </StaticPage>
  );
}
