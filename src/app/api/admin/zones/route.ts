import { zoneSchema } from '@/lib/admin-schemas';
import { collectionRoutes } from '@/server/admin-routes';
import { zones } from '@/server/services/admin';

const routes = collectionRoutes(zones, zoneSchema);
export const GET = routes.GET;
export const POST = routes.POST;
