'use server'

import { cookies } from 'next/headers'
import { verifyKunToken } from '~/app/api/utils/jwt'

export const verifyHeaderCookie = async () => {
  const cookieStore = await cookies()
  const token = cookieStore.get('kun-galgame-patch-moe-token')
  const payload = await verifyKunToken(token?.value ?? '')

  return payload
}
