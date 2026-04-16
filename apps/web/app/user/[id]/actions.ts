'use server'

import { z } from 'zod'
import { verifyHeaderCookie } from '~/utils/actions/verifyHeaderCookie'
import { safeParseSchema } from '~/utils/actions/safeParseSchema'
import { getUserProfile } from '~/app/api/user/status/info/route'

const getProfileSchema = z.object({
  id: z.coerce.number().min(1).max(9999999)
})

export const kunGetUserStatusActions = async (id: number) => {
  const input = safeParseSchema(getProfileSchema, { id })
  if (typeof input === 'string') {
    return input
  }
  const payload = await verifyHeaderCookie()

  const user = await getUserProfile(input, payload?.uid ?? 0)
  return user
}
