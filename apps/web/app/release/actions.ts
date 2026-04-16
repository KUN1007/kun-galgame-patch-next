'use server'

import { z } from 'zod'
import { safeParseSchema } from '~/utils/actions/safeParseSchema'
import { getReleaseSchema } from '~/validations/release'
import { getGalgameRelease } from '~/app/api/release/route'

export const kunGetActions = async (
  params: z.infer<typeof getReleaseSchema>
) => {
  const input = safeParseSchema(getReleaseSchema, params)
  if (typeof input === 'string') {
    return input
  }

  const response = await getGalgameRelease(input)
  return response
}
