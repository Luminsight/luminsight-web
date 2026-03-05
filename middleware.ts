import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Next.js Middleware - 인증 보호
 *
 * JWT는 localStorage에 저장되므로 미들웨어에서는 토큰을 읽을 수 없습니다.
 * (localStorage는 클라이언트 전용)
 *
 * 따라서 미들웨어에서는 공개 경로만 통과시키고,
 * 실제 인증 확인은 AuthProvider (클라이언트)에서 처리합니다.
 *
 * /login, /auth/* 는 항상 허용
 * 나머지는 AuthProvider에서 isAuthenticated 확인 후 /login으로 리다이렉트
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 공개 경로: 항상 통과
  const publicPaths = ['/login', '/auth', '/terms', '/privacy']
  const isPublic = publicPaths.some(p => pathname.startsWith(p))

  if (isPublic) {
    return NextResponse.next()
  }

  // 나머지는 통과 (클라이언트에서 AuthProvider가 처리)
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
}
