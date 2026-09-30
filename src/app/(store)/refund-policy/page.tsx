import type { Metadata } from 'next';
import { Placeholder, StaticPage } from '@/components/features/StaticPage';

export const metadata: Metadata = { title: 'Refunds & cancellation' };

/** PLACEHOLDER policy – reflects how the app works; the shop must confirm timelines before launch. */
export default function RefundPolicyPage() {
  return (
    <StaticPage title="Refunds & cancellation" backHref="/">
      <p>
        <Placeholder>Draft – to be confirmed by the shop before launch</Placeholder>
      </p>
      <h2>Cancelling an order</h2>
      <p>
        You can cancel from your order page until we start cleaning it. After that, please call the shop.
        Online orders that are not paid within 30 minutes are cancelled automatically.
      </p>
      <h2>Refunds</h2>
      <p>
        If a paid order is cancelled, the full amount is refunded to your original payment method.{' '}
        <Placeholder>Refund timeline (e.g. 5–7 working days) – to be confirmed</Placeholder>
      </p>
      <h2>Quality issues</h2>
      <p>
        If something is not right with your order, contact us on the day of delivery.{' '}
        <Placeholder>
          Replacement / refund rules for quality complaints – to be provided by the shop
        </Placeholder>
      </p>
    </StaticPage>
  );
}
