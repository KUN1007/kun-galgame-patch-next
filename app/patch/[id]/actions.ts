'use server'

import { cache } from 'react'
import { z } from 'zod'
import { verifyHeaderCookie } from '~/utils/actions/verifyHeaderCookie'
import { safeParseSchema } from '~/utils/actions/safeParseSchema'
import { getPatchById } from '~/app/api/patch/get'
import { getPatchIntroduction } from '~/app/api/patch/introduction/route'
import { getPatchDetail } from '~/app/api/patch/detail/route'
import { getPatchContributor } from '~/app/api/patch/contributor/route'
import { updatePatchViews } from '~/app/api/patch/views/put'
import { getNSFWHeader } from '~/utils/actions/getNSFWHeader'

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

    const response = await getPatchById(input, payload?.uid ?? 0)
    return response
  }
)

export const kunGetPatchIntroductionActions = cache(
  async (params: z.infer<typeof patchIdSchema>) => {
    const input = safeParseSchema(patchIdSchema, params)
    if (typeof input === 'string') {
      return input
    }

    const response = await getPatchIntroduction(input)
    return response
  }
)

export const kunGetContributorActions = cache(
  async (params: z.infer<typeof patchIdSchema>) => {
    const input = safeParseSchema(patchIdSchema, params)
    if (typeof input === 'string') {
      return input
    }

    const response = await getPatchContributor(input)
    return response
  }
)

export const kunGetPatchDetailActions = cache(
  async (params: z.infer<typeof patchIdSchema>) => {
    const input = safeParseSchema(patchIdSchema, params)
    if (typeof input === 'string') {
      return input
    }

    const nsfwEnable = await getNSFWHeader()
    const response = await getPatchDetail(input, nsfwEnable)
    return response
  }
)

export const kunUpdatePatchViewsActions = async (
  params: z.infer<typeof patchIdSchema>
) => {
  const input = safeParseSchema(patchIdSchema, params)
  if (typeof input === 'string') {
    return input
  }

  await updatePatchViews(input.patchId)
}
