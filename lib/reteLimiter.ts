import { redis } from './redis'
// import { NextRequest } from 'next/server'

export interface KunRateLimiterOptions {
  windowMs: number // milliseconds - how long to keep records of requests
  max: number // max number of requests during windowMs
  message: string // message to send
  identifier: string // identifier for the rate limiter (e.g., IP address)
}

export interface KunRateLimiterResponse {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

// FIXME: Race condition error
export const kunRateLimiter = async (
  // req: NextRequest,
  options: KunRateLimiterOptions
): Promise<KunRateLimiterResponse> => {
  const { windowMs, max, identifier } = options

  const key = `kun:patch:rate-limit:${identifier}`
  const now = Date.now()
  const windowStart = now - windowMs

  // Remove old requests
  await redis.zremrangebyscore(key, 0, windowStart)

  // Count current requests in window
  const requestCount = await redis.zcard(key)

  // Check if limit is exceeded
  if (requestCount >= max) {
    const oldestRequest = await redis.zrange(key, 0, 0, 'WITHSCORES')
    const resetTime =
      oldestRequest.length > 1
        ? parseInt(oldestRequest[1]) + windowMs
        : now + windowMs

    return {
      success: false,
      limit: max,
      remaining: 0,
      reset: Math.ceil((resetTime - now) / 1000) // seconds until reset
    }
  }

  // Add current request with timestamp
  await redis.zadd(key, now, `${now}-${Math.random()}`)
  // Set expiry on the set
  await redis.expire(key, Math.ceil(windowMs / 1000))

  const response: KunRateLimiterResponse = {
    success: true,
    limit: max,
    remaining: max - requestCount - 1,
    reset: Math.ceil(windowMs / 1000) // seconds until reset
  }
  return response
}
