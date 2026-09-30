import { handle, ok, parseJson } from '@/lib/api';
import { settingsSchema } from '@/lib/admin-schemas';
import { requireAdmin } from '@/server/auth';
import { getSettings, updateSettings } from '@/server/services/admin';

export const GET = handle(async () => {
  await requireAdmin();
  return ok({ settings: await getSettings() }, { headers: { 'Cache-Control': 'no-store' } });
});

export const PATCH = handle(async (req: Request) => {
  await requireAdmin();
  return ok({ settings: await updateSettings(await parseJson(req, settingsSchema)) });
});
