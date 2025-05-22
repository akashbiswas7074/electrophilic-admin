import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const adminId = request.cookies.get('adminId')?.value;

  // Public path that doesn't require authentication
  const isPublicPath = path === '/' || path === '/admin/login';

  // If not logged in and trying to access protected route, redirect to login
  if (!adminId && !isPublicPath) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  // If logged in and trying to access login page, redirect to dashboard
  if (adminId && isPublicPath) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/admin/login',
    '/admin/dashboard/:path*',
  ]
}
