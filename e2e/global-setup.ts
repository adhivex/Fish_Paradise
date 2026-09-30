import { PrismaClient } from '@prisma/client';

/**
 * Local/CI test database only: clear OTP rate-limit hits so repeated runs from the same IP are
 * not throttled, and make sure the products the tests order are available.
 */
export default async function globalSetup() {
  const url = process.env.DATABASE_URL ?? '';
  if (!/localhost|127\.0\.0\.1/.test(url)) {
    throw new Error('e2e tests must run against a local test database (DATABASE_URL on localhost).');
  }
  const db = new PrismaClient();
  try {
    await db.rateLimitHit.deleteMany({});
    await db.product.updateMany({
      where: { slug: { in: ['pomfret', 'crab', 'rohu'] } },
      data: { todayAvailable: true, stockGrams: null },
    });
    await db.shopSettings.update({ where: { id: 'shop' }, data: { acceptingOrders: true } });
  } finally {
    await db.$disconnect();
  }
}
