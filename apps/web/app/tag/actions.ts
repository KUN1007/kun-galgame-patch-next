'use server'

import { z } from 'zod'
import { safeParseSchema } from '~/utils/actions/safeParseSchema'
import { getTagSchema } from '~/validations/tag'
import { getTag } from '~/app/api/tag/all/route'

export const kunGetActions = async (params: z.infer<typeof getTagSchema>) => {
  const input = safeParseSchema(getTagSchema, params)
  if (typeof input === 'string') {
    return input
  }

  const response = await getTag(input)
  return response
}
