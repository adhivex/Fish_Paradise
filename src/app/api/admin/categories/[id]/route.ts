import { categorySchema } from '@/lib/admin-schemas';
import { itemRoutes } from '@/server/admin-routes';
import { categories } from '@/server/services/admin';

const routes = itemRoutes(categories, categorySchema);
export const PATCH = routes.PATCH;
export const DELETE = routes.DELETE;
