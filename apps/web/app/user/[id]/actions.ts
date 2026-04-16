'use server'

import { z } from 'zod'
import { verifyHeaderCookie } from '~/utils/actions/verifyHeaderCookie'
import { safeParseSchema } from '~/utils/actions/safeParseSchema'
import { kunServerGet } from '~/utils/actions/kunServerFetch'

const getProfileSchema = z.object({
  id: z.coerce.number().min(1).max(9999999)
})

export const kunGetUserStatusActions = async (id: number) => {
  const input = safeParseSchema(getProfileSchema, { id })
  if (typeof input === 'string') {
    return input
  }
  const payload = await verifyHeaderCookie()

  try {
    const user = await kunServerGet<any>('/user/' + input.id)
    return user
  } catch (err) {
    return `${err instanceof Error ? err.message : err}`
  }
}
