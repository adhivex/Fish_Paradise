import 'server-only';
import { db } from '@/server/db';

/**
 * Sliding-window rate limiter backed by Postgres, so limits hold across serverless instances.
 * Returns hit timestamps in the window (oldest first) *before* recording the new hit.
 */
export async function recentHits(key: string, windowMs: number, now = new Date()): Promise<number[]> {
  const rows = await db.rateLimitHit.findMany({
    where: { key, createdAt: { gt: new Date(now.getTime() - windowMs) } },
    select: { createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
  return rows.map((r) => r.createdAt.getTime());
}

export async function recordHit(...keys: string[]): Promise<void> {
  await db.rateLimitHit.createMany({ data: keys.map((key) => ({ key })) });
  // Opportunistic cleanup so the table stays small.
  if (Math.random() < 0.02) {
    await db.rateLimitHit.deleteMany({
      where: { createdAt: { lt: new Date(Date.now() - 24 * 60 * 60_000) } },
    });
  }
}

/** Simple fixed limit: throws-free check-and-record. Returns seconds to wait, or 0 if allowed. */
export async function consume(key: string, limit: number, windowMs: number): Promise<number> {
  const now = new Date();
  const hits = await recentHits(key, windowMs, now);
  if (hits.length >= limit) {
    return Math.max(1, Math.ceil((hits[0]! + windowMs - now.getTime()) / 1000));
  }
  await recordHit(key);
  return 0;
}
