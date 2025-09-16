import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

export async function middleware(req: NextRequest) {
  // Create a response object to pass along
  const res = NextResponse.next()

  // Create a Supabase client for the middleware
  const supabase = createMiddlewareClient({ req, res })

  // Get the current session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If no session and not already on /login, redirect
  if (!session && !req.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // If logged in and trying to access /login, send to dashboard (optional)
  if (session && req.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/admin/classes', req.url))
  }

  return res
}

// Protect everything except these routes/files
export const config = {
  matcher: ['/((?!api|_next|static|favicon.ico).*)'],
}
