'use server'

import { z } from 'zod'
import { safeParseSchema } from '~/utils/actions/safeParseSchema'
import {
  getCompanyByIdSchema,
  getPatchByCompanySchema
} from '~/validations/company'
import { kunServerGet } from '~/utils/actions/kunServerFetch'

export const kunGetCompanyByIdActions = async (
  params: z.infer<typeof getCompanyByIdSchema>
) => {
  const input = safeParseSchema(getCompanyByIdSchema, params)
  if (typeof input === 'string') {
    return input
  }

  try {
    const response = await kunServerGet<any>('/company/' + input.companyId)
    return response
  } catch (err) {
    return `${err instanceof Error ? err.message : err}`
  }
}

export const kunCompanyGalgameActions = async (
  params: z.infer<typeof getPatchByCompanySchema>
) => {
  const input = safeParseSchema(getPatchByCompanySchema, params)
  if (typeof input === 'string') {
    return input
  }

  try {
    const response = await kunServerGet<any>(
      '/company/' + input.companyId + '/patch',
      { page: input.page, limit: input.limit }
    )
    return response
  } catch (err) {
    return `${err instanceof Error ? err.message : err}`
  }
}
