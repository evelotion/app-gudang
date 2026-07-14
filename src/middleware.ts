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

  // 3. RBAC dengan JWT
  if (sessionCookie) {
    try {
      // Verifikasi token
      const { payload } = await jwtVerify(sessionCookie, getSecretKey());
      
      // SEMENTARA DIMATIKAN BUAT DEVELOPMENT BIAR STAF BISA BUKA SEMUA TAB
      /*
      const isStaf = payload.role !== "ADMIN";
      if (isStaf && (pathname.startsWith('/master-barang') || pathname.startsWith('/laporan'))) {
        return NextResponse.redirect(new URL('/', request.url));
      }
      */

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