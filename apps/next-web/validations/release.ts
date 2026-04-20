import { z } from 'zod'

export const getReleaseSchema = z.object({
  year: z.coerce.number().min(1).max(5000),
  month: z.coerce.number().min(1).max(12)
})
