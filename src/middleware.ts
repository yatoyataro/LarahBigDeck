import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

/**
 * Next.js Middleware for authentication and route protection
 * 
 * This middleware:
 * 1. Refreshes the user's auth session on every request
 * 2. Protects routes that require authentication
 * 3. Redirects unauthenticated users to login page
 */
export async function middleware(request: NextRequest) {
  // Refresh session
  const response = await updateSession(request)

  // Get the pathname
  const { pathname } = request.nextUrl

  // Define protected routes
  const protectedRoutes = ['/dashboard', '/upload', '/deck', '/study']
  
  // Check if the current path is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  )

  // If it's a protected route, verify authentication
  if (isProtectedRoute) {
    // Extract session cookie to check if user is authenticated
    const session = request.cookies.get('sb-access-token')

    if (!session) {
      // Redirect to login page if not authenticated
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return response
}

/**
 * Configure which routes should run the middleware
 * This matcher runs middleware on all routes except:
 * - _next/static (static files)
 * - _next/image (image optimization)
 * - favicon.ico (favicon)
 * - public files (e.g., images, fonts)
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
