import { jwtVerify, SignJWT } from 'jose';

/**
 * Signed session token in an httpOnly cookie. Used by `proxy.ts` (route gating) and by server
 * handlers, which additionally re-load the user from the database before trusting the role.
 * (No `server-only` import here: the proxy is not a React Server environment.)
 */
export const SESSION_COOKIE = 'fp_session';
export const SESSION_MAX_AGE_SEC = 30 * 24 * 60 * 60;

export type Role = 'CUSTOMER' | 'ADMIN';

export interface SessionClaims {
  sub: string; // user id
  role: Role;
}

/** Signing secret for sessions and OTP hashes. A fixed dev key is allowed outside production only. */
export function authSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') throw new Error('AUTH_SECRET is required');
  return secret ?? 'dev-only-insecure-secret-change-me';
}

function key(): Uint8Array {
  return new TextEncoder().encode(authSecret());
}

export async function createSessionToken(claims: SessionClaims): Promise<string> {
  return new SignJWT({ role: claims.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SEC}s`)
    .sign(key());
}

export async function verifySessionToken(token: string | undefined): Promise<SessionClaims | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ['HS256'] });
    const role = payload.role === 'ADMIN' ? 'ADMIN' : 'CUSTOMER';
    return payload.sub ? { sub: payload.sub, role } : null;
  } catch {
    return null;
  }
}

export function sessionCookieOptions(maxAge = SESSION_MAX_AGE_SEC) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };
}
