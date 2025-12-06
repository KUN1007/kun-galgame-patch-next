'use server'

import { getNSFWHeader } from '~/utils/actions/getNSFWHeader'
import { getHomeData } from '~/app/api/home/route'
import { verifyHeaderCookie } from '~/utils/actions/verifyHeaderCookie'

export const kunGetActions = async () => {
  const nsfwEnable = await getNSFWHeader()
  const payload = await verifyHeaderCookie()

  const response = await getHomeData(nsfwEnable)
  return { response, payload }
}
