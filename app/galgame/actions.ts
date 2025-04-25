'use server'

import { z } from 'zod'
import { safeParseSchema } from '~/utils/actions/safeParseSchema'
import { galgameSchema } from '~/validations/galgame'
import { getGalgame } from '~/app/api/galgame/route'
import { getNSFWHeader } from '~/utils/actions/getNSFWHeader'

export const kunGetActions = async (params: z.infer<typeof galgameSchema>) => {
  const input = safeParseSchema(galgameSchema, params)
  if (typeof input === 'string') {
    return input
  }

  const nsfwEnable = await getNSFWHeader()

  const response = await getGalgame(input, nsfwEnable)
  return response
}
