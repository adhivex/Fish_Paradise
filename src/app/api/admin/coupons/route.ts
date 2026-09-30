import { couponSchema } from '@/lib/admin-schemas';
import { collectionRoutes } from '@/server/admin-routes';
import { coupons } from '@/server/services/admin';

const routes = collectionRoutes(coupons, couponSchema);
export const GET = routes.GET;
export const POST = routes.POST;
