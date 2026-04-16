'use server'

import { cache } from 'react'
import { z } from 'zod'
import { verifyHeaderCookie } from '~/utils/actions/verifyHeaderCookie'
import { safeParseSchema } from '~/utils/actions/safeParseSchema'
import { kunServerGet, kunServerFetch } from '~/utils/actions/kunServerFetch'

const patchIdSchema = z.object({
  patchId: z.coerce.number().min(1).max(9999999)
})

export const kunGetPatchActions = cache(
  async (params: z.infer<typeof patchIdSchema>) => {
    const input = safeParseSchema(patchIdSchema, params)
    if (typeof input === 'string') {
      return input
    }
    const payload = await verifyHeaderCookie()

    try {
      const response = await kunServerGet<any>('/patch/' + input.patchId)
      return response
    } catch (err) {
      return `${err instanceof Error ? err.message : err}`
    }
  }
)

export const kunGetContributorActions = cache(
  async (params: z.infer<typeof patchIdSchema>) => {
    const input = safeParseSchema(patchIdSchema, params)
    if (typeof input === 'string') {
      return input
    }

    try {
      const response = await kunServerGet<any>(
        '/patch/' + input.patchId + '/contributor'
      )
      return response
    } catch (err) {
      return `${err instanceof Error ? err.message : err}`
    }
  }
)

export const kunGetPatchDetailActions = cache(
  async (params: z.infer<typeof patchIdSchema>) => {
    const input = safeParseSchema(patchIdSchema, params)
    if (typeof input === 'string') {
      return input
    }

    try {
      const response = await kunServerGet<any>(
        '/patch/' + input.patchId + '/detail'
      )
      return response
    } catch (err) {
      return `${err instanceof Error ? err.message : err}`
    }
  }
)

export const kunUpdatePatchViewsActions = async (
  params: z.infer<typeof patchIdSchema>
) => {
  const input = safeParseSchema(patchIdSchema, params)
  if (typeof input === 'string') {
    return input
  }

  try {
    await kunServerFetch<any>('/patch/' + input.patchId + '/view', {
      method: 'PUT'
    })
  } catch (err) {
    return `${err instanceof Error ? err.message : err}`
  }
}
