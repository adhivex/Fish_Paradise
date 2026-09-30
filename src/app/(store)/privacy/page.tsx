import type { Metadata } from 'next';
import { Placeholder, StaticPage } from '@/components/features/StaticPage';

export const metadata: Metadata = { title: 'Privacy policy' };

/** PLACEHOLDER legal text – the shop must have this reviewed and completed before launch. */
export default function PrivacyPage() {
  return (
    <StaticPage title="Privacy policy" backHref="/">
      <p>
        <Placeholder>Draft – to be reviewed by the shop before launch</Placeholder>
      </p>
      <h2>What we collect</h2>
      <p>
        Your mobile number (to log in and send order updates), your name and email if you add them, your
        delivery addresses, and your orders. We do not store card, UPI or bank details – payments are handled
        by Razorpay.
      </p>
      <h2>How we use it</h2>
      <p>
        Only to take, prepare and deliver your orders, contact you about them, and keep required business
        records. We do not sell your data.
      </p>
      <h2>Messages</h2>
      <p>We send one-time login codes and order updates by SMS or WhatsApp.</p>
      <h2>Your choices</h2>
      <p>
        You can edit your profile and addresses in your account. To delete your account, contact us:{' '}
        <Placeholder>shop email / phone – to be added</Placeholder>.
      </p>
      <h2>Contact</h2>
      <p>
        <Placeholder>Grievance officer name, address and email – to be added</Placeholder>
      </p>
    </StaticPage>
  );
}
