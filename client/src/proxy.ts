import { NextResponse, type NextRequest } from 'next/server';

/**
 * Optimistic route protection: no session cookie -> straight to /login, before any page renders.
 * This is a UX shortcut only. The Express API verifies the JWT on every request and is the real gate.
 */
export function proxy(request: NextRequest) {
  const hasSession = request.cookies.has('token');
  const { pathname, search } = request.nextUrl;

  if (pathname === '/login') {
    return hasSession ? NextResponse.redirect(new URL('/', request.url)) : NextResponse.next();
  }
  if (!hasSession) {
    const login = new URL('/login', request.url);
    if (pathname !== '/') login.searchParams.set('next', pathname + search);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  // Everything except the API rewrite, Next internals and static files.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|ico)$).*)'],
};
