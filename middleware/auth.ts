import { NextResponse } from 'next/server'
import { verifyHeaderCookie } from './_verifyHeaderCookie'
import type { NextRequest } from 'next/server'

const protectedRoutes = new Map<string, number>([
  ['/public', 0],
  ['/user', 1],
  ['/creator', 2],
  ['/admin', 3],
  ['/su', 4]
])

const verifyToken = async (token: string) => {
  // TODO:
  if (token === 'admin-token') return 3
  if (token === 'creator-token') return 2
  return 1
}

const redirectToLogin = (request: NextRequest) => {
  const loginUrl = new URL('/login', request.url)
  loginUrl.searchParams.set('from', request.nextUrl.pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/admin/:path*', '/creator/:path*', '/dashboard/:path*']
}

export const kunAuthMiddleware = async (request: NextRequest) => {
  // const pathname = request.nextUrl.pathname

  // const requiredRoles = protectedRoutes.get(pathname)
  // if (!requiredRoles) {
  //   return NextResponse.next()
  // }

  // const payload = await verifyHeaderCookie(request)
  // if (!payload) {
  //   return '用户未认证'
  // }

  // if (!requiredRoles.includes(userRole)) {
  //   return new NextResponse(
  //     JSON.stringify({
  //       error: 'Insufficient permissions'
  //     }),
  //     {
  //       status: 403,
  //       headers: { 'Content-Type': 'application/json' }
  //     }
  //   )
  // }

  return NextResponse.next()
}
