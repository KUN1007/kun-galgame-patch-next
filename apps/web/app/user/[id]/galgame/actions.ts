'use server'

import { z } from 'zod'
import { getUserInfoSchema } from '~/validations/user'
import { safeParseSchema } from '~/utils/actions/safeParseSchema'
import { getUserGalgame } from '~/app/api/user/profile/galgame/route'

export const kunGetActions = async (
  params: z.infer<typeof getUserInfoSchema>
) => {
  const input = safeParseSchema(getUserInfoSchema, params)
  if (typeof input === 'string') {
    return input
  }

  const response = await getUserGalgame(input)
  return response
}
