import { NextRequest, NextResponse } from 'next/server';
import { jwtDecode } from 'jwt-decode';

const PUBLIC_PATHS = ['/', '/login', '/signup', '/favicon.ico', '/api', '/_next', '/public'];

function isPublic(path: string) {
  return PUBLIC_PATHS.some((p) => path === p || path.startsWith(p));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  // Get token from cookies
  const token = request.cookies.get('kowasp-auth')?.value;
  if (!token) {
    // Not authenticated, redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Decode token to check role for admin routes
  try {
    const decoded: any = jwtDecode(token);
    if (pathname.startsWith('/admin')) {
      if (decoded.role !== 'admin') {
        // Not an admin, redirect to dashboard
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
    // Authenticated, allow access
    return NextResponse.next();
  } catch (e) {
    // Invalid token, redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: [
    // Protect all routes except public ones
    '/((?!_next/static|_next/image|favicon.ico|login|signup|api|public).*)',
  ],
}; 