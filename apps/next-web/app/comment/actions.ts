'use server'

import { z } from 'zod'
import { safeParseSchema } from '~/utils/actions/safeParseSchema'
import { commentSchema } from '~/validations/comment'
import { kunServerGet } from '~/utils/actions/kunServerFetch'

export const kunGetActions = async (params: z.infer<typeof commentSchema>) => {
  const input = safeParseSchema(commentSchema, params)
  if (typeof input === 'string') {
    return input
  }

  try {
    const response = await kunServerGet<any>('/comment', input)
    return response
  } catch (err) {
    return `${err instanceof Error ? err.message : err}`
  }
}
