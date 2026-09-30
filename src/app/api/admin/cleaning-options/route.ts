import { cleaningOptionSchema } from '@/lib/admin-schemas';
import { collectionRoutes } from '@/server/admin-routes';
import { cleaningOptions } from '@/server/services/admin';

const routes = collectionRoutes(cleaningOptions, cleaningOptionSchema);
export const GET = routes.GET;
export const POST = routes.POST;
