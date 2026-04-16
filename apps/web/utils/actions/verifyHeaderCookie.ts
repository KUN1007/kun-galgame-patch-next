'use server'

import { cookies } from 'next/headers'

export interface UserPayload {
  uid: number
  name: string
  role: number
}

// Verify the user's session by checking the kun_session cookie against the Go backend.
// Returns user payload if valid, null otherwise.
export const verifyHeaderCookie = async (): Promise<UserPayload | null> => {
  const cookieStore = await cookies()
  const session = cookieStore.get('kun_session')

  if (!session?.value) {
    return null
  }

  try {
    const apiBase =
      process.env.NEXT_PUBLIC_KUN_API_BASE_URL || 'http://127.0.0.1:5214'
    const res = await fetch(`${apiBase}/api/auth/me`, {
      headers: { Cookie: `kun_session=${session.value}` },
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
