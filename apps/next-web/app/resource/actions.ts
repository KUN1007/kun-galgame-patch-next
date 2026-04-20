'use server'

import { z } from 'zod'
import { safeParseSchema } from '~/utils/actions/safeParseSchema'
import { resourceSchema } from '~/validations/resource'
import { kunServerGet } from '~/utils/actions/kunServerFetch'

export const kunGetActions = async (params: z.infer<typeof resourceSchema>) => {
  const input = safeParseSchema(resourceSchema, params)
  if (typeof input === 'string') {
    return input
  }

  try {
    const response = await kunServerGet<any>('/resource', input)
    return response
  } catch (err) {
    return `${err instanceof Error ? err.message : err}`
  }
}
