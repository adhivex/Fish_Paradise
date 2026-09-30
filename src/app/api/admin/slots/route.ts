import { slotSchema } from '@/lib/admin-schemas';
import { collectionRoutes } from '@/server/admin-routes';
import { slots } from '@/server/services/admin';

const routes = collectionRoutes(slots, slotSchema);
export const GET = routes.GET;
export const POST = routes.POST;
