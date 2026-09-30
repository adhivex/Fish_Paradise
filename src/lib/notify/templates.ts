import { formatMoney } from '@/lib/money';

/** Message templates (also the WhatsApp template names to get approved by Meta / MSG91). */
export type TemplateName =
  'order_placed_owner' | 'order_confirmed' | 'order_out_for_delivery' | 'order_delivered' | 'order_cancelled';

export interface TemplateContext {
  shopName: string;
  orderNumber: string;
  customerName: string | null;
  totalPaise: number;
  slotLabel: string | null;
  itemsSummary: string;
  paymentMethod: string;
  cancelReason: string | null;
  trackUrl: string;
}

export function renderTemplate(name: TemplateName, c: TemplateContext): string {
  const hi = c.customerName ? `Hi ${c.customerName.split(' ')[0]}, ` : 'Hi, ';
  switch (name) {
    case 'order_placed_owner':
      return `New order ${c.orderNumber}: ${c.itemsSummary}. Total ${formatMoney(c.totalPaise)} (${c.paymentMethod}). Delivery: ${c.slotLabel ?? 'ASAP'}.`;
    case 'order_confirmed':
      return `${hi}your ${c.shopName} order ${c.orderNumber} (${formatMoney(c.totalPaise)}) is confirmed. Delivery: ${c.slotLabel ?? 'ASAP'}. Track: ${c.trackUrl}`;
    case 'order_out_for_delivery':
      return `${hi}your ${c.shopName} order ${c.orderNumber} is out for delivery. Track: ${c.trackUrl}`;
    case 'order_delivered':
      return `${hi}your ${c.shopName} order ${c.orderNumber} has been delivered. Enjoy your fresh seafood!`;
    case 'order_cancelled':
      return `${hi}your ${c.shopName} order ${c.orderNumber} was cancelled${c.cancelReason ? ` (${c.cancelReason})` : ''}. Any payment made will be refunded.`;
  }
}
