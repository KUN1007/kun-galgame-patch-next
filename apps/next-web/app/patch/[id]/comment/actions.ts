'use server'

import { z } from 'zod'
import { verifyHeaderCookie } from '~/utils/actions/verifyHeaderCookie'
import { safeParseSchema } from '~/utils/actions/safeParseSchema'
import { getPatchCommentSchema } from '~/validations/patch'
import { kunServerGet } from '~/utils/actions/kunServerFetch'

export const kunGetCommentActions = async (
  params: z.infer<typeof getPatchCommentSchema>
) => {
  const input = safeParseSchema(getPatchCommentSchema, params)
  if (typeof input === 'string') {
    return input
  }
  const payload = await verifyHeaderCookie()

  try {
    const response = await kunServerGet<any>(
      '/patch/' + input.patchId + '/comment',
      { page: input.page, limit: input.limit }
    )
    return response
  } catch (err) {
    return `${err instanceof Error ? err.message : err}`
  }
}

export const kunGetCommentVerifyStatusActions = async () => {
  try {
    const response = await kunServerGet<any>('/admin/setting/comment/verify-status')
    return response
  } catch (err) {
    return `${err instanceof Error ? err.message : err}`
  }
}
