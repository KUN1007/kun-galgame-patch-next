'use server'

import { z } from 'zod'
import { safeParseSchema } from '~/utils/actions/safeParseSchema'
import { getPersonSchema } from '~/validations/person'
import { kunServerGet } from '~/utils/actions/kunServerFetch'

export const kunGetActions = async (
  params: z.infer<typeof getPersonSchema>
) => {
  const input = safeParseSchema(getPersonSchema, params)
  if (typeof input === 'string') {
    return input
  }

  try {
    const response = await kunServerGet<any>('/person', input)
    return response
  } catch (err) {
    return `${err instanceof Error ? err.message : err}`
  }
}
