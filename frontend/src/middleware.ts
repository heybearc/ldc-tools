// NextAuth v4 Middleware
import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow access to auth pages and API routes
  if (
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico')
  ) {
    return NextResponse.next()
  }

  // Check for NextAuth session token
  const sessionToken = request.cookies.get('next-auth.session-token') || 
                       request.cookies.get('__Secure-next-auth.session-token')
  
  // If no session token, redirect to signin
  if (!sessionToken) {
    const signinUrl = new URL('/auth/signin', request.url)
    signinUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(signinUrl)
  }

  const retired = retiredDestination(pathname)
  if (retired) {
    return NextResponse.redirect(new URL(retired, request.url))
  }

  return NextResponse.next()
}

function retiredDestination(pathname: string): string | null {
  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
    return '/'
  }

  const retiredHelp = [
    '/help/projects',
    '/help/volunteers',
    '/help/volunteer-roles',
    '/help/crew-requests',
    '/help/schedule-notifications',
  ]
  if (retiredHelp.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return '/help'
  }

  const retiredApp = [
    '/volunteers',
    '/contacts',
    '/congregations',
    '/projects',
    '/calendar',
    '/crew-request',
    '/crew-requests',
    '/my-requests',
  ]
  if (retiredApp.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return '/'
  }

  return null
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
