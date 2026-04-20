'use server'

import { z } from 'zod'
import { safeParseSchema } from '~/utils/actions/safeParseSchema'
import { kunServerGet } from '~/utils/actions/kunServerFetch'
import { adminPaginationSchema } from '~/validations/admin'

export const kunGetActions = async (
  params: z.infer<typeof adminPaginationSchema>
) => {
  const input = safeParseSchema(adminPaginationSchema, params)
  if (typeof input === 'string') {
    return input
  }

  try {
    const response = await kunServerGet<any>('/admin/creator', input)
    return response
  } catch (error) {
    return (error as Error).message
  }
}
