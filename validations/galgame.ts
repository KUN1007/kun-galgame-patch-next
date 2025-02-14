import { z } from 'zod'

export const galgameSchema = z.object({
  selectedType: z.string().min(1).max(107),
  sortField: z.union([
    z.literal('created'),
    z.literal('view'),
    z.literal('download')
  ]),
  sortOrder: z.union([z.literal('asc'), z.literal('desc')]),
  page: z.coerce.number().min(1).max(9999999),
  limit: z.coerce.number().min(1).max(24),
  year: z.string().max(9999),
  month: z.string().max(12)
})
