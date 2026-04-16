'use server'

import { z } from 'zod'
import { safeParseSchema } from '~/utils/actions/safeParseSchema'
import { getCharSchema } from '~/validations/char'
import { kunServerGet } from '~/utils/actions/kunServerFetch'

export const kunGetActions = async (params: z.infer<typeof getCharSchema>) => {
  const input = safeParseSchema(getCharSchema, params)
  if (typeof input === 'string') {
    return input
  }

  try {
    const response = await kunServerGet<any>('/character', input)
    return response
  } catch (err) {
    return `${err instanceof Error ? err.message : err}`
  }
}
