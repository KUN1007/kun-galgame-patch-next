'use server'

import { z } from 'zod'
import { getPatchComment } from '~/app/api/patch/comment/get'
import { verifyHeaderCookie } from '~/utils/actions/verifyHeaderCookie'
import { safeParseSchema } from '~/utils/actions/safeParseSchema'

const patchIdSchema = z.object({
  patchId: z.coerce.number().min(1).max(9999999)
})

export const kunGetActions = async (params: z.infer<typeof patchIdSchema>) => {
  const input = safeParseSchema(patchIdSchema, params)
  if (typeof input === 'string') {
    return input
  }
  const payload = await verifyHeaderCookie()

  const response = await getPatchComment(input, payload?.uid ?? 0)
  return response
}
