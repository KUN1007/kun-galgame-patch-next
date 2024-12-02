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

const redirectToLogin = (request: NextRequest) => {
  const loginUrl = new URL('/login', request.url)
  loginUrl.searchParams.set('from', request.nextUrl.pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: [
    '/public/:path*',
    '/user/:path*',
    '/creator/:path*',
    '/admin/:path*',
    '/su/:path*'
  ]
}

export const kunAuthMiddleware = async (request: NextRequest) => {
  const pathname = request.nextUrl.pathname

  const pathElements = pathname.split('/')
  const secondElement = pathElements[2]

  // const requiredRole = protectedRoutes.get(secondElement)

  // if (!requiredRole) {
  //   return NextResponse.next()
  // }

  // const payload = await verifyHeaderCookie(request)

  // if (!payload) {
  //   request.headers.set('x-uid', '0')
  //   request.headers.set('x-role', '0')
  //   return NextResponse.next()
  // }

  // if (payload.role < requiredRole) {
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

  // request.headers.set('x-uid', String(payload.uid))
  // request.headers.set('x-role', String(payload.role))

  return NextResponse.next()
}
