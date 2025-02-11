import { z } from 'zod'
import { MIN_FILE_SIZE, MAX_SMALL_FILE_SIZE } from '~/config/upload'

export const resourceSchema = z.object({
  sortField: z.union([
    z.literal('created'),
    z.literal('download'),
    z.literal('like')
  ]),
  sortOrder: z.union([z.literal('asc'), z.literal('desc')]),
  page: z.coerce.number().min(1).max(9999999),
  limit: z.coerce.number().min(1).max(50)
})

export const resourceUploadSchema = z.object({
  fileSize: z.coerce
    .number()
    .min(MIN_FILE_SIZE, { message: '文件的最小大小不能小于 1KB' })
    .max(MAX_SMALL_FILE_SIZE, { message: '小文件的最大大小不能超过 100MB' }),
  fileName: z.string().min(1).max(1007)
})
