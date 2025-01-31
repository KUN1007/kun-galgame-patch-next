'use server'

import { z } from 'zod'
import { verifyHeaderCookie } from '~/utils/actions/verifyHeaderCookie'
import { safeParseSchema } from '~/utils/actions/safeParseSchema'
import { getPatchById } from '~/app/api/patch/get'
import { getPatchIntroduction } from '~/app/api/patch/introduction/route'
import { getPatchContributor } from '~/app/api/patch/contributor/route'

const patchIdSchema = z.object({
  patchId: z.coerce.number().min(1).max(9999999)
})

export const kunGetPatchActions = async (
  params: z.infer<typeof patchIdSchema>
) => {
  const input = safeParseSchema(patchIdSchema, params)
  if (typeof input === 'string') {
    return input
  }
  const payload = await verifyHeaderCookie()

  const response = await getPatchById(input, payload?.uid ?? 0)
  return response
}

export const kunGetPatchIntroductionActions = async (
  params: z.infer<typeof patchIdSchema>
) => {
  const input = safeParseSchema(patchIdSchema, params)
  if (typeof input === 'string') {
    return input
  }

  const response = await getPatchIntroduction(input)
  return response
}

export const kunGetContributorActions = async (
  params: z.infer<typeof patchIdSchema>
) => {
  const input = safeParseSchema(patchIdSchema, params)
  if (typeof input === 'string') {
    return input
  }

  const response = await getPatchContributor(input)
  return response
}
