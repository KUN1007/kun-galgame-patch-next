'use server'

import { cache } from 'react'
import { z } from 'zod'
import { safeParseSchema } from '~/utils/actions/safeParseSchema'
import { verifyHeaderCookie } from '~/utils/actions/verifyHeaderCookie'
import { getPatchResourceDetail } from '~/app/api/resource/detail/route'

const resourceIdSchema = z.object({
  resourceId: z.coerce.number().min(1).max(9999999)
})

export const kunGetResourceDetailActions = cache(
  async (params: z.infer<typeof resourceIdSchema>) => {
    const input = safeParseSchema(resourceIdSchema, params)
    if (typeof input === 'string') {
      return input
    }
    const payload = await verifyHeaderCookie()

    const response = await getPatchResourceDetail(input, payload?.uid ?? 0)
    return response
  }
)
