import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const session = request.cookies.get('gudang_session')
  const isLoginPage = request.nextUrl.pathname === '/login'

  // Kalau belum login dan mau buka dashboard, tendang ke login
  if (!session && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Kalau udah login tapi iseng buka halaman login, tendang ke dashboard
  if (session && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}