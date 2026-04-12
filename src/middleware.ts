import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

// HAPUS fallback "rahasia_gudang_sync_12345" dan ganti dengan throw error
if (!process.env.JWT_SECRET) {
  throw new Error("FATAL: JWT_SECRET environment variable is missing in middleware!");
}
const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET);

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
      // Verifikasi token. Kalau gagal (di-modify dari luar), lari ke block catch
      const { payload } = await jwtVerify(sessionCookie, SECRET_KEY);
      const isStaf = payload.role !== "ADMIN";
      
      // Kalau dia STAF dan mencoba akses halaman terlarang
      if (isStaf && (pathname.startsWith('/master-barang') || pathname.startsWith('/laporan'))) {
        return NextResponse.redirect(new URL('/', request.url));
      }
    } catch (e) {
      // Token tidak valid/di-hack/expired, tendang ke login dan hapus cookie
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