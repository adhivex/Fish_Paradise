import 'server-only';
import { after } from 'next/server';
import { env } from '@/lib/env';
import { log } from '@/lib/log';
import { notifyProvider, type NotifyProvider } from '@/lib/notify/providers';
import { renderTemplate, type TemplateName } from '@/lib/notify/templates';
import { maskPhone } from '@/lib/phone';
import { formatQty } from '@/lib/qty';
import type { OrderStatus } from '@/lib/types';
import { db } from '@/server/db';

const CUSTOMER_TEMPLATE: Partial<Record<OrderStatus, TemplateName>> = {
  CONFIRMED: 'order_confirmed',
  OUT_FOR_DELIVERY: 'order_out_for_delivery',
  DELIVERED: 'order_delivered',
  CANCELLED: 'order_cancelled',
};

async function deliver(
  provider: NotifyProvider,
  orderId: string,
  to: string | null | undefined,
  template: TemplateName,
  text: string,
): Promise<void> {
  if (!to) {
    await db.notificationLog.create({
      data: {
        orderId,
        channel: provider.channel,
        template,
        recipient: '-',
        status: 'SKIPPED',
        error: 'No recipient',
      },
    });
    return;
  }
  try {
    await provider.send({ to, template, text });
    await db.notificationLog.create({
      data: { orderId, channel: provider.channel, template, recipient: maskPhone(to), status: 'SENT' },
    });
    log.info('notify.sent', { orderId, template, channel: provider.channel });
  } catch (err) {
    log.error('notify.failed', { orderId, template, channel: provider.channel, err });
    await db.notificationLog
      .create({
        data: {
          orderId,
          channel: provider.channel,
          template,
          recipient: maskPhone(to),
          status: 'FAILED',
          error: err instanceof Error ? err.message.slice(0, 300) : 'Unknown error',
        },
      })
      .catch(() => {});
  }
}

/**
 * Sends the notifications for an order event. Never throws: failures are logged and must not
 * block order creation or status changes.
 */
export async function notifyOrderEvent(orderId: string, event: OrderStatus | 'PLACED_OWNER'): Promise<void> {
  try {
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { user: { select: { phone: true, name: true } }, items: true },
    });
    if (!order) return;
    const settings = await db.shopSettings.findUnique({ where: { id: 'shop' } });
    const provider = notifyProvider();
    const ctx = {
      shopName: settings?.shopName ?? 'Fish Paradise',
      orderNumber: order.orderNumber,
      customerName: order.user.name,
      totalPaise: order.totalPaise,
      slotLabel: order.slotLabel,
      itemsSummary: order.items.map((i) => `${i.nameSnapshot} ${formatQty(i.qtyGrams)}`).join(', '),
      paymentMethod: order.paymentMethod,
      cancelReason: order.cancelReason,
      trackUrl: `${env().NEXT_PUBLIC_APP_URL}/orders/${order.orderNumber}`,
    };
    if (event === 'PLACED_OWNER') {
      const ownerPhone = env().OWNER_NOTIFY_PHONE ?? settings?.whatsapp ?? settings?.phone;
      await deliver(
        provider,
        order.id,
        ownerPhone,
        'order_placed_owner',
        renderTemplate('order_placed_owner', ctx),
      );
      return;
    }
    const template = CUSTOMER_TEMPLATE[event];
    if (template)
      await deliver(provider, order.id, order.user.phone, template, renderTemplate(template, ctx));
  } catch (err) {
    log.error('notify.unexpected', { orderId, event, err });
  }
}

/** Runs notifications after the response is sent (inside a request), or in the background otherwise. */
export function queueNotification(orderId: string, event: OrderStatus | 'PLACED_OWNER'): void {
  try {
    after(() => notifyOrderEvent(orderId, event));
  } catch {
    void notifyOrderEvent(orderId, event);
  }
}
