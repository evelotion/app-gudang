import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

// Bungkus dalam fungsi biar aman dari build-time crash Vercel
function getSecretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("FATAL: JWT_SECRET environment variable is missing!");
  }
  return new TextEncoder().encode(secret);
}

export async function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('gudang_session')?.value
  const pathname = request.nextUrl.pathname

  // 1. Kalau belum login mau ke dashboard
  if (!sessionCookie && !pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 2. Kalau udah login tapi mau ke /login
  if (sessionCookie && pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // 3. Verifikasi token (tidak ada pembatasan RBAC per route saat ini —
  // semua route yang ada (/, /aset/**) boleh diakses ADMIN maupun STAF)
  if (sessionCookie) {
    try {
      await jwtVerify(sessionCookie, getSecretKey());
    } catch (e) {
      // Token kedaluwarsa atau tidak valid
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('gudang_session');
      return response;
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}