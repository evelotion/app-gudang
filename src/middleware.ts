import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('gudang_session')?.value
  const pathname = request.nextUrl.pathname

  // 1. Kalau belum login tapi mau akses halaman dashboard, lempar ke /login
  if (!sessionCookie && !pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 2. Kalau udah login tapi mau ke /login, balikin ke dashboard
  if (sessionCookie && pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // 3. RBAC (Role-Based Access Control)
  if (sessionCookie) {
    try {
      const session = JSON.parse(sessionCookie);
      const isStaf = session.role !== "ADMIN";
      
      // Kalau dia STAF dan mencoba akses halaman terlarang, tendang ke /
      if (isStaf && (pathname.startsWith('/master-barang') || pathname.startsWith('/laporan'))) {
        return NextResponse.redirect(new URL('/', request.url));
      }
    } catch (e) {
      // Abaikan jika JSON parse gagal
    }
  }

  return NextResponse.next()
}

// Konfigurasi path mana aja yang mau dicegat sama middleware ini
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}