import { parseCookies } from '~/utils/cookies'
import { verifyKunToken } from '~/server/utils/jwt'

export const verifyHeaderCookie = async (req: Request) => {
  const token = parseCookies(req.headers.get('cookie') ?? '')[
    'kun-galgame-patch-moe-token'
  ]
  const payload = await verifyKunToken(token ?? '')

  return payload
}
