import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken';
import { jwtVerify } from 'jose';
 
export async function middleware(request: NextRequest) {
  // Get the path of the request
  const path = request.nextUrl.pathname;
  
  // Skip middleware for non-admin paths, API routes, and static assets
  if (!path.startsWith('/admin') || 
      path.startsWith('/api/') || 
      path.startsWith('/_next/') ||
      path.match(/\.(jpg|png|svg|ico)$/)) {
    return NextResponse.next();
  }
  
  // Public admin paths that don't require authentication
  const publicAdminPaths = ['/admin/login'];
  if (publicAdminPaths.includes(path)) {
    // Check if already logged in via adminToken or NextAuth
    const adminToken = request.cookies.get('adminToken')?.value;
    const nextAuthToken = request.cookies.get('next-auth.session-token')?.value;
    
    // If logged in and trying to access login page, redirect to dashboard
    if ((adminToken || nextAuthToken) && path === '/admin/login') {
      try {
        // Verify token is valid
        const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || "fallback-secret";
        
        if (adminToken) {
          jwt.verify(adminToken, secret);
        } else if (nextAuthToken) {
          // Verify NextAuth token
          const secretKey = new TextEncoder().encode(secret);
          await jwtVerify(nextAuthToken, secretKey);
        }
        
        // Token is valid, redirect to dashboard
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      } catch (error) {
        // Token is invalid, allow access to login page
        console.error("Token verification error:", error);
        return NextResponse.next();
      }
    }
    
    return NextResponse.next();
  }
  
  // Protected admin paths that require authentication
  if (path.startsWith('/admin/dashboard')) {
    // Check if authenticated via adminToken or NextAuth
    const adminToken = request.cookies.get('adminToken')?.value;
    const nextAuthToken = request.cookies.get('next-auth.session-token')?.value;
    
    if (!adminToken && !nextAuthToken) {
      // Create the redirect URL with a return_to parameter
      const redirectUrl = new URL('/admin/login', request.url);
      redirectUrl.searchParams.set('return_to', path);
      
      return NextResponse.redirect(redirectUrl);
    }
    
    try {
      // Verify token
      const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || "fallback-secret";
      
      if (adminToken) {
        jwt.verify(adminToken, secret);
      } else if (nextAuthToken) {
        // Verify NextAuth token
        const secretKey = new TextEncoder().encode(secret);
        await jwtVerify(nextAuthToken, secretKey);
      }
      
      // Token is valid, continue
      return NextResponse.next();
    } catch (error) {
      // Token is invalid, redirect to login
      console.error("Token verification error:", error);
      const redirectUrl = new URL('/admin/login', request.url);
      redirectUrl.searchParams.set('return_to', path);
      
      return NextResponse.redirect(redirectUrl);
    }
  }

  return NextResponse.next();
}

// Configure which paths should trigger the middleware
export const config = {
  matcher: [
    '/admin/:path*',
  ],
};
