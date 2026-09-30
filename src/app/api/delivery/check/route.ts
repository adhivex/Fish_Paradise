import type { NextRequest } from 'next/server';
import { ApiError, handle, ok } from '@/lib/api';
import { pincodeSchema } from '@/lib/validation';
import { findZone } from '@/server/services/pricing';

/** GET /api/delivery/check?pincode= */
export const GET = handle(async (req: NextRequest) => {
  const parsed = pincodeSchema.safeParse(req.nextUrl.searchParams.get('pincode') ?? '');
  if (!parsed.success) throw new ApiError('VALIDATION', 'Enter a valid 6-digit pincode.');
  const zone = await findZone(parsed.data);
  return ok({
    pincode: parsed.data,
    serviceable: !!zone,
    areaName: zone?.areaName ?? null,
    feePaise: zone?.deliveryFeePaise ?? null,
    freeAbovePaise: zone?.freeAbovePaise ?? null,
    minOrderPaise: zone?.minOrderPaise ?? null,
  });
});
