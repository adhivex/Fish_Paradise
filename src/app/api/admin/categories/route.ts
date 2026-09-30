import { categorySchema } from '@/lib/admin-schemas';
import { collectionRoutes } from '@/server/admin-routes';
import { categories } from '@/server/services/admin';

const routes = collectionRoutes(categories, categorySchema);
export const GET = routes.GET;
export const POST = routes.POST;
