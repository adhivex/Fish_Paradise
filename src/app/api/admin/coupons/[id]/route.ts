import { couponSchema } from '@/lib/admin-schemas';
import { itemRoutes } from '@/server/admin-routes';
import { coupons } from '@/server/services/admin';

const routes = itemRoutes(coupons, couponSchema);
export const PATCH = routes.PATCH;
export const DELETE = routes.DELETE;
