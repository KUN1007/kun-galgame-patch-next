'use server'

import { z } from 'zod'
import { getUserInfoSchema } from '~/validations/user'
import { safeParseSchema } from '~/utils/actions/safeParseSchema'
import { getUserContribute } from '~/app/api/user/profile/contribute/route'

export const kunGetActions = async (
  params: z.infer<typeof getUserInfoSchema>
) => {
  const input = safeParseSchema(getUserInfoSchema, params)
  if (typeof input === 'string') {
    return input
  }

  const response = await getUserContribute(input)
  return response
}
