'use server'

import { getHomeData } from '~/app/api/home/route'

export const kunGetActions = async () => {
  const response = await getHomeData()
  return response
}
