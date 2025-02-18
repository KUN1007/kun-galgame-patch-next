'use server'

import { z } from 'zod'
import { safeParseSchema } from '~/utils/actions/safeParseSchema'
import { getWalkthrough } from '~/app/api/patch/walkthrough/get'

const patchIdSchema = z.object({
  patchId: z.coerce.number().min(1).max(9999999)
})

export const kunGetActions = async (params: z.infer<typeof patchIdSchema>) => {
  const input = safeParseSchema(patchIdSchema, params)
  if (typeof input === 'string') {
    return input
  }

  const response = await getWalkthrough(input)
  return response
}
