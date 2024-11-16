import { z } from 'zod'
import { ALL_SUPPORTED_TYPES } from '~/components/patch/resource/_constants'

export const galgameSchema = z.object({
  selectedTypes: z
    .array(z.string())
    .refine(
      (types) => types.every((type) => ALL_SUPPORTED_TYPES.includes(type)),
      { message: '非法的补丁类型' }
    ),
  sortField: z.union([
    z.literal('created'),
    z.literal('type'),
    z.literal('view')
  ]),
  sortOrder: z.union([z.literal('asc'), z.literal('desc')]),
  page: z.number().min(1).max(9999999),
  limit: z.number().min(1).max(24)
})
