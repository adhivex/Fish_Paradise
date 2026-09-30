import { z } from 'zod';
import { ApiError, handle, ok, parseJson } from '@/lib/api';
import { env } from '@/lib/env';
import { requireUser } from '@/server/auth';
import { simulateGatewayPayment } from '@/server/services/payments';

const bodySchema = z.object({ orderNumber: z.string().max(20), outcome: z.enum(['success', 'failure']) });

/** POST /api/dev/fake-pay – local testing without Razorpay keys. Disabled in production. */
export const POST = handle(async (req: Request) => {
  if (env().NODE_ENV === 'production' || env().PAYMENT_PROVIDER !== 'fake') {
    throw new ApiError('NOT_FOUND', 'Not found.', 404);
  }
  const user = await requireUser();
  const { orderNumber, outcome } = await parseJson(req, bodySchema);
  return ok(await simulateGatewayPayment(user.id, orderNumber, outcome));
});
