'use server'

import { z } from 'zod'
import { safeParseSchema } from '~/utils/actions/safeParseSchema'
import { adminPaginationSchema } from '~/validations/admin'
import { getUserInfo } from '~/app/api/admin/user/get'

export const kunGetActions = async (
  params: z.infer<typeof adminPaginationSchema>
) => {
  const input = safeParseSchema(adminPaginationSchema, params)
  if (typeof input === 'string') {
    return input
  }

  const response = await getUserInfo(input)
  return response
}
