import { parseCookies } from '~/utils/cookies'
import { verifyKunToken } from '~/app/api/utils/jwt'
import type { NextRequest } from 'next/server'

export const verifyHeaderCookie = async (req: NextRequest) => {
  const token = parseCookies(req.headers.get('cookie') ?? '')[
    'kun-galgame-patch-moe-token'
  ]
  const payload = await verifyKunToken(token ?? '')

  return payload
}
