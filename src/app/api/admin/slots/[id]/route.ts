import { slotSchema } from '@/lib/admin-schemas';
import { itemRoutes } from '@/server/admin-routes';
import { slots } from '@/server/services/admin';

const routes = itemRoutes(slots, slotSchema);
export const PATCH = routes.PATCH;
export const DELETE = routes.DELETE;
