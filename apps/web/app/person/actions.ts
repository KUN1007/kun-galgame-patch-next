'use server'

import { z } from 'zod'
import { safeParseSchema } from '~/utils/actions/safeParseSchema'
import { getPersonSchema } from '~/validations/person'
import { getPerson } from '~/app/api/person/all/route'

export const kunGetActions = async (
  params: z.infer<typeof getPersonSchema>
) => {
  const input = safeParseSchema(getPersonSchema, params)
  if (typeof input === 'string') {
    return input
  }
  const response = await getPerson(input)
  return response
}
