import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '~/prisma/index'
import { kunRateLimiter } from '~/lib/reteLimiter'
import { getRemoteIp } from '~/app/api/utils/getRemoteIp'

// Define allowed origins
// const allowedOrigins = ['hikarinagi.com']

// Rate limit configuration
const RATE_LIMIT_MAX = 10000
const RATE_LIMIT_WINDOW_MS = 60000

export const GET = async (request: NextRequest) => {
  // Get the vndb_id from the query parameters
  const { searchParams } = new URL(request.url)
  const vndbId = searchParams.get('vndb_id')

  // const origin = request.headers.get('origin') || ''
  // const isAllowedOrigin = allowedOrigins.includes(origin)

  // if (!isAllowedOrigin && origin) {
  //   return new NextResponse(
  //     JSON.stringify({
  //       success: false,
  //       message:
  //         'CORS error: This origin is not allowed to access this resource',
  //       url: null
  //     }),
  //     {
  //       status: 403,
  //       headers: {
  //         'Content-Type': 'application/json'
  //       }
  //     }
  //   )
  // }

  const ip = getRemoteIp(request.headers)
  const rateLimitResult = await kunRateLimiter({
    windowMs: RATE_LIMIT_WINDOW_MS,
    max: RATE_LIMIT_MAX,
    message: 'Too many requests, please try again later.',
    // identifier: `${ip}:${origin}`
    identifier: ip
  })

  const headers = {
    'Content-Type': 'application/json',
    'X-RateLimit-Limit': rateLimitResult.limit.toString(),
    'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
    'X-RateLimit-Reset': rateLimitResult.reset.toString(),
    // 'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Expose-Headers':
      'X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset'
  }

  if (!rateLimitResult.success) {
    return new NextResponse(
      JSON.stringify({
        success: false,
        message: 'Rate limit exceeded. Please try again later.',
        url: null
      }),
      { status: 429, headers }
    )
  }

  if (!vndbId) {
    return new NextResponse(
      JSON.stringify({
        success: false,
        message: 'Missing required parameter: vndb_id',
        url: null
      }),
      { status: 400, headers }
    )
  }

  try {
    const patch = await prisma.patch.findUnique({
      where: {
        vndb_id: vndbId
      }
    })

    if (!patch) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          message: `No patch found for VNDB ID: ${vndbId}`,
          url: null
        }),
        { status: 404, headers }
      )
    }

    const url = `https://www.moyu.moe/patch/${patch.id}/resource`

    return new NextResponse(
      JSON.stringify({
        success: true,
        message: 'Patch found successfully',
        url
      }),
      { status: 200, headers }
    )
  } catch (error) {
    return new NextResponse(
      JSON.stringify({
        success: false,
        message: `An error occurred while processing your request ${error}`,
        url: null
      }),
      { status: 500, headers }
    )
  }
}
