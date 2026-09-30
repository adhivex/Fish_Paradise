import type { NextRequest } from 'next/server';
import { handle, ok } from '@/lib/api';
import { requireAdmin } from '@/server/auth';
import { listAdminOrders, type QueueName } from '@/server/services/admin';

const QUEUES: QueueName[] = ['new', 'preparing', 'out', 'done'];

/** GET /api/admin/orders?queue=new|preparing|out|done&date=YYYY-MM-DD */
export const GET = handle(async (req: NextRequest) => {
  await requireAdmin();
  const q = req.nextUrl.searchParams.get('queue');
  const queue = QUEUES.find((x) => x === q) ?? 'new';
  const date = req.nextUrl.searchParams.get('date');
  return ok(await listAdminOrders(queue, date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null), {
    headers: { 'Cache-Control': 'no-store' },
  });
});
