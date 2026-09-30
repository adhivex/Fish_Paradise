import { handle, ok } from '@/lib/api';
import { requireAdmin } from '@/server/auth';
import { signUpload } from '@/server/services/admin';

/** POST /api/admin/uploads/sign – signed Cloudinary upload parameters. */
export const POST = handle(async () => {
  await requireAdmin();
  return ok(signUpload());
});
