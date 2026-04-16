'use server'

import { z } from 'zod'
import { safeParseSchema } from '~/utils/actions/safeParseSchema'
import { verifyHeaderCookie } from '~/utils/actions/verifyHeaderCookie'
import { kunServerGet } from '~/utils/actions/kunServerFetch'

const patchIdSchema = z.object({
  patchId: z.coerce.number().min(1).max(9999999)
})

export const kunGetActions = async (params: z.infer<typeof patchIdSchema>) => {
  const input = safeParseSchema(patchIdSchema, params)
  if (typeof input === 'string') {
    return input
  }
  const payload = await verifyHeaderCookie()

  try {
    const response = await kunServerGet<any>('/patch/' + input.patchId + '/resource')
    return { response, payload }
  } catch (err) {
    return {
      response: `${err instanceof Error ? err.message : err}`,
      payload
    }
  }
}
