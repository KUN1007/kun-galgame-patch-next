import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { kunAuthMiddleware } = await import('./middleware/auth')
  kunAuthMiddleware(request)
  return NextResponse.next()
}
