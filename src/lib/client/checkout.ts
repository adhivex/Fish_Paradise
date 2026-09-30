'use client';

import { api } from '@/lib/client/api';

export interface CheckoutParams {
  provider: 'razorpay' | 'fake';
  keyId: string | null;
  razorpayOrderId: string;
  amountPaise: number;
  currency: 'INR';
  prefill: { contact: string; name: string | null; email: string | null };
}

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open(): void;
  on(event: 'payment.failed', cb: () => void): void;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

function loadScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Could not load the payment window. Check your connection.'));
    document.body.appendChild(s);
  });
}

/**
 * Opens the payment step for a new order and resolves with where to go next. The order is only
 * marked paid by the webhook; the confirmation page waits for it.
 */
export async function startCheckout(
  orderNumber: string,
  checkout: CheckoutParams,
  shopName: string,
): Promise<string> {
  const confirmed = `/orders/${orderNumber}/confirmed`;
  if (checkout.provider === 'fake') return `/pay/${orderNumber}`;
  await loadScript();
  const Razorpay = window.Razorpay;
  if (!Razorpay || !checkout.keyId) throw new Error('Online payment is not available right now.');
  return new Promise((resolve) => {
    const rzp = new Razorpay({
      key: checkout.keyId,
      amount: checkout.amountPaise,
      currency: checkout.currency,
      name: shopName,
      description: `Order ${orderNumber}`,
      order_id: checkout.razorpayOrderId,
      prefill: {
        contact: checkout.prefill.contact,
        name: checkout.prefill.name ?? undefined,
        email: checkout.prefill.email ?? undefined,
      },
      theme: { color: '#0A2A2F' },
      handler: (res: RazorpayResponse) => {
        // Optional fast check for the UI; the webhook remains the source of truth.
        void api('/api/payments/verify', { body: res }).catch(() => {});
        resolve(confirmed);
      },
      modal: { ondismiss: () => resolve(`/orders/${orderNumber}`) },
    });
    rzp.on('payment.failed', () => resolve(`/orders/${orderNumber}`));
    rzp.open();
  });
}
