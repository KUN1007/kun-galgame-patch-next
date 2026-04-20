'use server'

import { z } from 'zod'
import { safeParseSchema } from '~/utils/actions/safeParseSchema'
import { getCompanySchema } from '~/validations/company'
import { kunServerGet } from '~/utils/actions/kunServerFetch'

export const kunGetActions = async (
  params: z.infer<typeof getCompanySchema>
) => {
  const input = safeParseSchema(getCompanySchema, params)
  if (typeof input === 'string') {
    return input
  }

  try {
    const response = await kunServerGet<any>('/company', input)
    return response
  } catch (err) {
    return `${err instanceof Error ? err.message : err}`
  }
}
