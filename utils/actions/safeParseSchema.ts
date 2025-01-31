import { z } from 'zod'
import type { ZodSchema } from 'zod'

export const safeParseSchema = <T extends ZodSchema>(
  schema: T,
  object: Record<string, unknown>
): z.infer<T> | string => {
  const result = schema.safeParse(object)
  if (!result.success) {
    return result.error.message
  }
  return result.data
}
