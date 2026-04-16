'use server'

import { z } from 'zod'
import { safeParseSchema } from '~/utils/actions/safeParseSchema'
import { getMessageSchema } from '~/validations/message'
import { verifyHeaderCookie } from '~/utils/actions/verifyHeaderCookie'
import { kunServerGet } from '~/utils/actions/kunServerFetch'

export const kunGetActions = async (
  params: z.infer<typeof getMessageSchema>
) => {
  const input = safeParseSchema(getMessageSchema, params)
  if (typeof input === 'string') {
    return input
  }
  const payload = await verifyHeaderCookie()
  if (!payload) {
    return '用户登陆失效'
  }

  try {
    const response = await kunServerGet<any>('/message', input)
    return response
  } catch (err) {
    return `${err instanceof Error ? err.message : err}`
  }
}

export const kunGetUserInfoActions = async () => {
  const payload = await verifyHeaderCookie()
  if (!payload) {
    return '用户登陆失效'
  }

  try {
    return await kunServerGet<any>('/auth/me')
  } catch (err) {
    return `${err instanceof Error ? err.message : err}`
  }
}
