import { z } from 'zod'

export const adminPaginationSchema = z.object({
  page: z.number().min(1).max(9999999),
  limit: z.number().min(1).max(100)
})
