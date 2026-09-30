import { handle, ok } from '@/lib/api';
import { handleRazorpayWebhook } from '@/server/services/payments';

/**
 * POST /api/webhooks/razorpay – signature verified against the RAW body, idempotent via
 * WebhookEvent. Configure in Razorpay Dashboard → Webhooks with events payment.captured,
 * payment.failed and order.paid.
 */
export const POST = handle(async (req: Request) => {
  const raw = await req.text();
  const result = await handleRazorpayWebhook(
    raw,
    req.headers.get('x-razorpay-signature'),
    req.headers.get('x-razorpay-event-id'),
  );
  return ok(result);
});
