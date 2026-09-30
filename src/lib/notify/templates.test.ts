import { describe, expect, it } from 'vitest';
import { renderTemplate, type TemplateContext } from './templates';

const ctx: TemplateContext = {
  shopName: 'Fish Paradise',
  orderNumber: 'FP1024',
  customerName: 'Rahul Sharma',
  totalPaise: 101500,
  slotLabel: 'Today, 5:00 – 6:00 PM',
  itemsSummary: 'Pomfret 1.5 kg',
  paymentMethod: 'COD',
  cancelReason: null,
  trackUrl: 'https://example.test/orders/FP1024',
};

describe('renderTemplate', () => {
  it('renders customer messages with first name, total and link', () => {
    expect(renderTemplate('order_confirmed', ctx)).toBe(
      'Hi Rahul, your Fish Paradise order FP1024 (₹1,015) is confirmed. Delivery: Today, 5:00 – 6:00 PM. Track: https://example.test/orders/FP1024',
    );
    expect(renderTemplate('order_delivered', { ...ctx, customerName: null })).toMatch(
      /^Hi, your Fish Paradise/,
    );
  });

  it('includes the cancel reason when present', () => {
    expect(renderTemplate('order_cancelled', { ...ctx, cancelReason: 'Out of stock' })).toContain(
      '(Out of stock)',
    );
  });

  it('renders the owner alert', () => {
    expect(renderTemplate('order_placed_owner', ctx)).toBe(
      'New order FP1024: Pomfret 1.5 kg. Total ₹1,015 (COD). Delivery: Today, 5:00 – 6:00 PM.',
    );
  });
});
