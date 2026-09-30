import { z } from 'zod';
import { handle, ok, parseJson } from '@/lib/api';
import { addressInputSchema } from '@/lib/address';
import { requireUser } from '@/server/auth';
import { rateLimit } from '@/server/guard';
import { createAddress, listAddresses } from '@/server/services/addresses';

const createSchema = addressInputSchema.extend({ isDefault: z.boolean().optional() });

/** GET /api/addresses – the user's address book with serviceability per pincode. */
export const GET = handle(async () => {
  const user = await requireUser();
  return ok({ addresses: await listAddresses(user.id) });
});

/** POST /api/addresses */
export const POST = handle(async (req: Request) => {
  const user = await requireUser();
  await rateLimit('addressWrite', user.id);
  const input = await parseJson(req, createSchema);
  return ok({ address: await createAddress(user.id, input) }, { status: 201 });
});
