import { zoneSchema } from '@/lib/admin-schemas';
import { itemRoutes } from '@/server/admin-routes';
import { zones } from '@/server/services/admin';

const routes = itemRoutes(zones, zoneSchema);
export const PATCH = routes.PATCH;
export const DELETE = routes.DELETE;
