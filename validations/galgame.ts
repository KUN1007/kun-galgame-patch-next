import { z } from 'zod'
import { ALL_SUPPORTED_TYPE } from '~/constants/resource'

export const galgameSchema = z.object({
  selectedTypes: z
    .array(z.string())
    .min(1)
    .max(10)
    .refine(
      (types) => types.every((type) => ALL_SUPPORTED_TYPE.includes(type)),
      { message: '非法的补丁类型' }
    ),
  sortField: z.union([
    z.literal('created'),
    z.literal('type'),
    z.literal('view')
  ]),
  sortOrder: z.union([z.literal('asc'), z.literal('desc')]),
  page: z.coerce.number().min(1).max(9999999),
  limit: z.coerce.number().min(1).max(24)
})
