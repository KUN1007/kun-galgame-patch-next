'use server'

import { verifyHeaderCookie } from '~/utils/actions/verifyHeaderCookie'
import { kunServerGet } from '~/utils/actions/kunServerFetch'

export const kunGetActions = async (link: string) => {
  const payload = await verifyHeaderCookie()
  if (!payload) {
    return '用户登陆失效'
  }

  try {
    const response = await kunServerGet<any>(`/chat/room/${link}`, {
      cursor: 0,
      limit: 30
    })
    return response
  } catch (error) {
    return (error as Error).message
  }
}
