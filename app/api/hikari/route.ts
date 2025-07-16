import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '~/prisma/index'
import { kunRateLimiter } from '~/lib/reteLimiter'
import { getRemoteIp } from '~/app/api/utils/getRemoteIp'
import type { HikariResponse } from './type'

const DOMAIN_PATTERNS = [
  /^http:\/\/localhost:\d+$/,
  /^http:\/\/127.0.0.1:\d+$/,
  // Hikarinagi
  /^https:\/\/([\w-]+\.)*himoe\.uk$/,
  /^https:\/\/([\w-]+\.)*hikarinagi\.com$/,
  /^https:\/\/([\w-]+\.)*hikarinagi\.org$/,
  // TouchGal
  /^https:\/\/([\w-]+\.)*touchgal\.us$/,
  // Nysoure
  /^https:\/\/([\w-]+\.)*nyne\.dev$/
]

const RATE_LIMIT_MAX = 10000
const RATE_LIMIT_WINDOW_MS = 60000

export const GET = async (
  request: NextRequest
): Promise<NextResponse<HikariResponse>> => {
  const { searchParams } = new URL(request.url)
  const vndbId = searchParams.get('vndb_id')

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
    return new NextResponse(
      JSON.stringify({
        success: false,
        message: 'Rate limit exceeded. Please try again later.',
        data: null
      }),
      { status: 429, headers }
    )
  }

  if (!vndbId) {
    return new NextResponse(
      JSON.stringify({
        success: false,
        message: 'Missing required parameter: vndb_id',
        data: null
      }),
      { status: 400, headers }
    )
  }

  try {
    const patch = await prisma.patch.findUnique({
      where: { vndb_id: vndbId },
      include: {
        user: {
          select: { name: true, id: true, avatar: true }
        },
        resource: {
          omit: { content: true },
          include: {
            user: {
              select: { name: true, id: true, avatar: true }
            }
          }
        }
      }
    })

    if (!patch) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          message: `No patch found for VNDB ID: ${vndbId}`,
          data: null
        }),
        { status: 404, headers }
      )
    }

    return new NextResponse(
      JSON.stringify({
        success: true,
        message: 'Patch found successfully',
        data: patch
      }),
      { status: 200, headers }
    )
  } catch (error) {
    return new NextResponse(
      JSON.stringify({
        success: false,
        message: `An error occurred while processing your request ${error}`,
        data: null
      }),
      { status: 500, headers }
    )
  }
}
