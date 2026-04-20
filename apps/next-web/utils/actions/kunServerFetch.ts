// Server-side fetch utility for calling the Go Fiber backend from Next.js server actions.
// This runs on the server (Node.js), so it can access the Go backend directly via localhost.

import { cookies } from 'next/headers'

const API_BASE =
  process.env.NEXT_PUBLIC_KUN_API_BASE_URL || 'http://127.0.0.1:5214'

interface ApiResponse<T> {
  code: number
  message: string
  data: T
  total?: number
}

export async function kunServerFetch<T>(
  path: string,
  options?: {
    query?: Record<string, string | number>
    method?: string
    body?: Record<string, unknown>
  }
): Promise<T> {
  const { query, method = 'GET', body } = options || {}

  const queryString = query
    ? '?' +
      Object.entries(query)
        .map(([k, v]) => `${k}=${v}`)
        .join('&')
    : ''

  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('kun_session')

  const headers: Record<string, string> = {}
  if (sessionCookie) {
    headers['Cookie'] = `kun_session=${sessionCookie.value}`
  }
  if (body) {
    headers['Content-Type'] = 'application/json'
  }

  // Forward NSFW header from cookie store
  const nsfwCookie = cookieStore.get('kun-patch-nsfw')
  if (nsfwCookie) {
    headers['x-nsfw-header'] = JSON.stringify({
      showNSFW: nsfwCookie.value === 'true'
    })
  }

  const res = await fetch(`${API_BASE}/api${path}${queryString}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store'
  })

  const json: ApiResponse<T> = await res.json()

  if (json.code !== 0) {
    throw new Error(json.message)
  }

  return json.data
}

// Convenience wrappers
export async function kunServerGet<T>(
  path: string,
  query?: Record<string, string | number>
): Promise<T> {
  return kunServerFetch<T>(path, { query })
}

export async function kunServerPost<T>(
  path: string,
  body?: Record<string, unknown>
): Promise<T> {
  return kunServerFetch<T>(path, { method: 'POST', body })
}
