import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/session';

/**
 * Route gating. Browsing is public; checkout, orders and account pages need a session; admin
 * pages and APIs need role ADMIN. Handlers re-check against the database (rule 6).
 */
export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const claims = await verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  const isApi = pathname.startsWith('/api/');

  if (!claims) {
    if (isApi) {
      return NextResponse.json(
        { error: { code: 'UNAUTHENTICATED', message: 'Please log in to continue.' } },
        { status: 401 },
      );
    }
    const login = new URL('/login', req.url);
    login.searchParams.set('next', `${pathname}${search}`);
    return NextResponse.redirect(login);
  }

  const adminArea =
    pathname === '/admin' || pathname.startsWith('/admin/') || pathname.startsWith('/api/admin/');
  if (adminArea && claims.role !== 'ADMIN') {
    if (isApi) {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Admins only.' } }, { status: 403 });
    }
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/checkout',
    '/payment',
    '/pay/:path*',
    '/orders/:path*',
    '/account/addresses',
    '/account/favourites',
    '/admin/:path*',
    '/api/admin/:path*',
  ],
};
