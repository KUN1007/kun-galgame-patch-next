import { parseCookies } from '~/utils/cookies'
import type { NextRequest } from 'next/server'

export const getNSFWHeader = (req: NextRequest) => {
  const cookies = parseCookies(req.headers.get('cookie') ?? '')
  const token = cookies['kun-patch-setting-store|state|data|kunNsfwEnable']
  if (!token) {
    return { content_limit: 'sfw' }
  }

  if (token === 'all') {
    return {}
  } else {
    return { content_limit: token }
  }
}
