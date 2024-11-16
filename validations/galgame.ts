import { z } from 'zod'

export const galgameSchema = z.object({
  sort: z.union([z.literal('created'), z.literal('type'), z.literal('view')]),
  page: z.number().min(1).max(9999999),
  limit: z.number().min(1).max(9999999)
})
