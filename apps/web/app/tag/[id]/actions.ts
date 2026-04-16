'use server'

import { z } from 'zod'
import { safeParseSchema } from '~/utils/actions/safeParseSchema'
import { getTagByIdSchema, getPatchByTagSchema } from '~/validations/tag'
import { kunServerGet } from '~/utils/actions/kunServerFetch'

export const kunGetTagByIdActions = async (
  params: z.infer<typeof getTagByIdSchema>
) => {
  const input = safeParseSchema(getTagByIdSchema, params)
  if (typeof input === 'string') {
    return input
  }

  try {
    const response = await kunServerGet<any>('/tag/' + input.tagId)
    return response
  } catch (err) {
    return `${err instanceof Error ? err.message : err}`
  }
}

export const kunTagGalgameActions = async (
  params: z.infer<typeof getPatchByTagSchema>
) => {
  const input = safeParseSchema(getPatchByTagSchema, params)
  if (typeof input === 'string') {
    return input
  }

  try {
    const response = await kunServerGet<any>(
      '/tag/' + input.tagId + '/patch',
      { page: input.page, limit: input.limit }
    )
    return response
  } catch (err) {
    return `${err instanceof Error ? err.message : err}`
  }
}
