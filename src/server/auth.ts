import 'server-only';
import { cookies } from 'next/headers';
import { ApiError } from '@/lib/api';
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions, verifySessionToken } from '@/lib/session';
import { findSessionUser, type SessionUser } from '@/server/services/auth';

/** Current user from the session cookie, re-loaded from the database (role included). */
export async function currentUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const claims = await verifySessionToken(jar.get(SESSION_COOKIE)?.value);
  if (!claims) return null;
  return findSessionUser(claims.sub);
}

export async function requireUser(): Promise<SessionUser> {
  const user = await currentUser();
  if (!user) throw new ApiError('UNAUTHENTICATED', 'Please log in to continue.', 401);
  return user;
}

/** Admin check in every admin handler (the proxy checks too – rule 6). */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== 'ADMIN') throw new ApiError('FORBIDDEN', 'Admins only.', 403);
  return user;
}

export async function startSession(user: SessionUser): Promise<void> {
  const jar = await cookies();
  jar.set(
    SESSION_COOKIE,
    await createSessionToken({ sub: user.id, role: user.role }),
    sessionCookieOptions(),
  );
}

export async function endSession(): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, '', sessionCookieOptions(0));
}
