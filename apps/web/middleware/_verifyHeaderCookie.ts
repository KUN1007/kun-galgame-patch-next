import { parseCookies } from '~/utils/cookies'
import type { NextRequest } from 'next/server'

interface MiddlewarePayload {
  uid: number
  name: string
  role: number
}

export const verifyHeaderCookie = async (
  req: NextRequest
): Promise<MiddlewarePayload | null> => {
  const cookies = parseCookies(req.headers.get('cookie') ?? '')
  const session = cookies['kun_session']
  if (!session) {
    return null
  }

  try {
    const apiBase =
      process.env.NEXT_PUBLIC_KUN_API_BASE_URL || 'http://127.0.0.1:5214'
    const res = await fetch(`${apiBase}/api/auth/me`, {
      headers: { Cookie: `kun_session=${session}` },
      cache: 'no-store'
    })

    if (!res.ok) {
      return null
    }

    const json = await res.json()
    if (json.code !== 0 || !json.data) {
      return null
    }

    return {
      uid: json.data.uid,
      name: json.data.name,
      role: json.data.role
    }
  } catch {
    return null
  }
}
