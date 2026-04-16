'use server'

import { z } from 'zod'
import { safeParseSchema } from '~/utils/actions/safeParseSchema'
import { getReleaseSchema } from '~/validations/release'
import { kunServerGet } from '~/utils/actions/kunServerFetch'

export const kunGetActions = async (
  params: z.infer<typeof getReleaseSchema>
) => {
  const input = safeParseSchema(getReleaseSchema, params)
  if (typeof input === 'string') {
    return input
  }

  try {
    const response = await kunServerGet<any>('/release', input)
    return response
  } catch (err) {
    return `${err instanceof Error ? err.message : err}`
  }
}
