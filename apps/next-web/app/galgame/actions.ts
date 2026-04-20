'use server'

import { z } from 'zod'
import { safeParseSchema } from '~/utils/actions/safeParseSchema'
import { galgameSchema } from '~/validations/galgame'
import { kunServerGet } from '~/utils/actions/kunServerFetch'

export const kunGetActions = async (params: z.infer<typeof galgameSchema>) => {
  const input = safeParseSchema(galgameSchema, params)
  if (typeof input === 'string') {
    return input
  }

  try {
    const response = await kunServerGet<any>('/galgame', input)
    return response
  } catch (err) {
    return `${err instanceof Error ? err.message : err}`
  }
}
