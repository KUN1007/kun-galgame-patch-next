import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const method = request.method.toUpperCase()

  if (method === 'GET') {
    return NextResponse.next()
  }

  if (pathname === '/api/patch/views' && method === 'PUT') {
    return NextResponse.next()
  }

  const msg =
    '网站目前正在数据同步中, 约 2025 年 11 月 11 日晚 11 点完成同步（一天后），请一天后再来操作'
  return NextResponse.json(msg)
}

export const config = {
  matcher: ['/api/:path*']
}
