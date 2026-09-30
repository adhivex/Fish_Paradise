import { handle, ok } from '@/lib/api';
import { endSession } from '@/server/auth';

/** POST /api/auth/logout */
export const POST = handle(async () => {
  await endSession();
  return ok({ loggedOut: true });
});
