'use server'

import { z } from 'zod'
import { safeParseSchema } from '~/utils/actions/safeParseSchema'
import { commentSchema } from '~/validations/comment'
import { getComment } from '~/app/api/comment/route'

export const kunGetActions = async (params: z.infer<typeof commentSchema>) => {
  const input = safeParseSchema(commentSchema, params)
  if (typeof input === 'string') {
    return input
  }

  const response = await getComment(input)
  return response
}
