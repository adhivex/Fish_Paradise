import { z } from 'zod';
import { handle, ok, parseJson } from '@/lib/api';
import { currentUser, requireUser } from '@/server/auth';
import { updateProfile } from '@/server/services/auth';

/** GET /api/me – `{ user: null }` when logged out (not an error: browsing is allowed). */
export const GET = handle(async () => {
  return ok({ user: await currentUser() }, { headers: { 'Cache-Control': 'no-store' } });
});

const patchSchema = z.object({
  name: z.string().trim().min(1, 'Enter your name').max(60).optional(),
  email: z
    .union([z.email('Enter a valid email'), z.literal('')])
    .optional()
    .transform((v) => (v === '' ? null : v)),
});

/** PATCH /api/me { name?, email? } */
export const PATCH = handle(async (req: Request) => {
  const user = await requireUser();
  const data = await parseJson(req, patchSchema);
  return ok({ user: await updateProfile(user.id, data) });
});
