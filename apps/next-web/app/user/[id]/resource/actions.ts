'use server'

import { z } from 'zod'
import { getUserInfoSchema } from '~/validations/user'
import { safeParseSchema } from '~/utils/actions/safeParseSchema'
import { kunServerGet } from '~/utils/actions/kunServerFetch'

export const kunGetActions = async (
  params: z.infer<typeof getUserInfoSchema>
) => {
  const input = safeParseSchema(getUserInfoSchema, params)
  if (typeof input === 'string') {
    return input
  }

  try {
    const response = await kunServerGet<any>(
      '/user/' + input.uid + '/resource',
      { page: input.page, limit: input.limit }
    )
    return response
  } catch (err) {
    return `${err instanceof Error ? err.message : err}`
  }
}
