'use server'

import { z } from 'zod'
import { getPatchHistorySchema } from '~/validations/patch'
import { getPatchHistory } from '~/app/api/patch/history/route'
import { safeParseSchema } from '~/utils/actions/safeParseSchema'

export const kunGetActions = async (
  params: z.infer<typeof getPatchHistorySchema>
) => {
  const input = safeParseSchema(getPatchHistorySchema, params)
  if (typeof input === 'string') {
    return input
  }

  const response = await getPatchHistory(input)
  return response
}
