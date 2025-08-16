import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '~/prisma/index'
import { kunRateLimiter } from '~/lib/reteLimiter'
import { getRemoteIp } from '~/app/api/utils/getRemoteIp'

const DOMAIN_PATTERNS = [
  /^http:\/\/localhost:\d+$/,
  /^http:\/\/127.0.0.1:\d+$/,
  /^https:\/\/([\w-]+\.)*touchgal\.us$/
]

const RATE_LIMIT_MAX = 10
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000

interface MoyuResponse<T> {
  success: boolean
  message: string
  data: T | null
}

export const GET = async (
  request: NextRequest
): Promise<NextResponse<MoyuResponse<string[]>>> => {
  const origin = request.headers.get('origin') ?? ''
  const isAllowedOrigin = origin
    ? DOMAIN_PATTERNS.some((pattern) => pattern.test(origin))
    : false
  const corsHeaders = {
    'Access-Control-Allow-Origin': isAllowedOrigin ? origin : '',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Expose-Headers':
      'X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset'
  }
  const ip = getRemoteIp(request.headers)
  const rateLimitResult = await kunRateLimiter({
    windowMs: RATE_LIMIT_WINDOW_MS,
    max: RATE_LIMIT_MAX,
    message: 'Too many requests, please try again later.',
    identifier: `${ip}:${origin || 'unknown'}`
  })
  const headers = {
    'Content-Type': 'application/json',
    'X-RateLimit-Limit': rateLimitResult.limit.toString(),
    'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
    'X-RateLimit-Reset': rateLimitResult.reset.toString(),
    ...corsHeaders
  }
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { headers: corsHeaders })
  }
  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        success: false,
        message: 'Rate limit exceeded. Please try again later.',
        data: null
      },
      { status: 429, headers }
    )
  }

  try {
    const patchesWithResource = await prisma.patch.findMany({
      where: {
        vndb_id: { not: null },
        resource: {
          some: {}
        }
      },
      select: {
        vndb_id: true
      }
    })

    const vndbIdArray: string[] = patchesWithResource.map((p) => p.vndb_id!)

    return NextResponse.json(
      {
        success: true,
        message: 'success',
        data: vndbIdArray
      },
      { status: 200, headers }
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      {
        success: false,
        message: `An error occurred while processing your request: ${errorMessage}`,
        data: null
      },
      { status: 500, headers }
    )
  }
}
