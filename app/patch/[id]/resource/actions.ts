'use server'

import { z } from 'zod'
import { safeParseSchema } from '~/utils/actions/safeParseSchema'
import { verifyHeaderCookie } from '~/utils/actions/verifyHeaderCookie'
import { getPatchResource } from '~/app/api/patch/resource/get'

const patchIdSchema = z.object({
  patchId: z.coerce.number().min(1).max(9999999)
})

export const kunGetActions = async (params: z.infer<typeof patchIdSchema>) => {
  const input = safeParseSchema(patchIdSchema, params)
  if (typeof input === 'string') {
    return input
  }
  const payload = await verifyHeaderCookie()

  const response = await getPatchResource(input, payload?.uid ?? 0)
  return response
}
