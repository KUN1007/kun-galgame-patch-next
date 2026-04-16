'use server'

import { z } from 'zod'
import { safeParseSchema } from '~/utils/actions/safeParseSchema'
import { getCharSchema } from '~/validations/char'
import { getChar } from '~/app/api/character/all/route'

export const kunGetActions = async (params: z.infer<typeof getCharSchema>) => {
  const input = safeParseSchema(getCharSchema, params)
  if (typeof input === 'string') {
    return input
  }
  const response = await getChar(input)
  return response
}
