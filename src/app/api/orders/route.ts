import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { handle, ok, parseJson } from '@/lib/api';
import { ORDER_FILTERS, statusesForFilter } from '@/lib/orders';
import { slotChoiceSchema } from '@/lib/validation';
import { requireUser } from '@/server/auth';
import { rateLimit } from '@/server/guard';
import { createOrder, listOrders } from '@/server/services/orders';

const createSchema = z.object({
  addressId: z.string().min(1).max(40),
  slot: slotChoiceSchema,
  paymentMethod: z.enum(['UPI', 'CARD', 'NETBANKING', 'COD']),
  notes: z.string().max(500).nullish(),
});

/** POST /api/orders – creates an order from the server cart. Online methods get checkout params. */
export const POST = handle(async (req: Request) => {
  const user = await requireUser();
  await rateLimit('orderCreate', user.id);
  const input = await parseJson(req, createSchema);
  return ok(await createOrder(user, input), { status: 201 });
});

/** GET /api/orders?status=All|Preparing|Out for delivery|Delivered */
export const GET = handle(async (req: NextRequest) => {
  const user = await requireUser();
  const raw = req.nextUrl.searchParams.get('status') ?? 'All';
  const filter = ORDER_FILTERS.find((f) => f === raw) ?? 'All';
  return ok(
    { orders: await listOrders(user.id, statusesForFilter(filter)) },
    { headers: { 'Cache-Control': 'no-store' } },
  );
});
