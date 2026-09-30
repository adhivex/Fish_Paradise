import { handle, ok } from '@/lib/api';
import { slotAvailability } from '@/server/services/slots';

/** GET /api/slots – ASAP availability and the next occurrence of each scheduled slot (IST). */
export const GET = handle(async () => {
  const { availability } = await slotAvailability();
  return ok(availability, { headers: { 'Cache-Control': 'no-store' } });
});
