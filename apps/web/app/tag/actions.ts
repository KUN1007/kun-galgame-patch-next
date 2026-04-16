'use server'

import { z } from 'zod'
import { safeParseSchema } from '~/utils/actions/safeParseSchema'
import { getTagSchema } from '~/validations/tag'
import { kunServerGet } from '~/utils/actions/kunServerFetch'

export const kunGetActions = async (params: z.infer<typeof getTagSchema>) => {
  const input = safeParseSchema(getTagSchema, params)
  if (typeof input === 'string') {
    return input
  }

  try {
    const response = await kunServerGet<any>('/tag', input)
    return response
  } catch (err) {
    return `${err instanceof Error ? err.message : err}`
  }
}
