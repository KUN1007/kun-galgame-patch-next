'use server'

import { getNSFWHeader } from '~/utils/actions/getNSFWHeader'
import { getHomeData } from '~/app/api/home/route'

export const kunGetActions = async () => {
  const nsfwEnable = await getNSFWHeader()
  const response = await getHomeData(nsfwEnable)
  return response
}
