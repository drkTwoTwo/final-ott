import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect admin routes
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  // Allow admin login page
  if (pathname === '/admin/login') {
    return NextResponse.next();
  }

  // Supabase auth cookie (works in Edge)
  const hasSession =
    request.cookies.get('sb-access-token') ||
    request.cookies.get('sb-refresh-token');

  if (!hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
