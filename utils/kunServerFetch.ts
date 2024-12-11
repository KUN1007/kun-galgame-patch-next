'use server'

import { cookies } from 'next/headers'

export const kunServerFetchGet = async <T>(
  url: string,
  query?: Record<string, string | number>
): Promise<T> => {
  const queryString = query
    ? '?' +
      Object.entries(query)
        .map(([key, value]) => `${key}=${value}`)
        .join('&')
    : ''

  const fetchAddress =
    process.env.NODE_ENV === 'development'
      ? process.env.NEXT_PUBLIC_KUN_PATCH_ADDRESS_DEV
      : process.env.NEXT_PUBLIC_KUN_PATCH_ADDRESS_PROD
  const fullUrl = `http://${fetchAddress}/api${url}${queryString}`

  const cookieStore = await cookies()
  const fetchOptions: RequestInit = {
    method: 'GET',
    credentials: 'include',
    mode: 'cors',
    headers: {
      Cookie: cookieStore.toString(),
      'Content-Type': 'application/json'
    }
  }

  const response = await fetch(fullUrl, fetchOptions)

  const res = await response.json()
  return res
}
