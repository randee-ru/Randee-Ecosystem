import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'
import { COOKIE_NAME, AUTH_SECRET } from './lib/auth-config'

const JWT_SECRET = new TextEncoder().encode(AUTH_SECRET)

const PROTECTED = ['/workspace', '/builder']
const AUTH_PAGES = ['/login', '/register']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProtected = PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  const isAuthPage = AUTH_PAGES.some((p) => pathname === p || pathname.startsWith(`${p}/`))

  const token = request.cookies.get(COOKIE_NAME)?.value
  let isAuthenticated = false

  if (token) {
    try {
      await jwtVerify(token, JWT_SECRET)
      isAuthenticated = true
    } catch {
      isAuthenticated = false
    }
  }

  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isAuthPage && isAuthenticated) {
    return NextResponse.redirect(new URL('/workspace', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/workspace/:path*', '/builder/:path*', '/login', '/register'],
}
