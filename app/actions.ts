'use server'

import { setKUNGalgameTask } from '~/server/cron'
import { getHomeData } from '~/app/api/home/route'

setKUNGalgameTask()

export const kunGetActions = async () => {
  const response = await getHomeData()
  return response
}
