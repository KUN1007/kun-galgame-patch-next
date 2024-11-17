import { z } from 'zod'

export const searchSchema = z.object({
  query: z
    .array(
      z
        .string()
        .trim()
        .min(1)
        .max(107, { message: '单个搜索关键词最大长度为 107' })
    )
    .min(1)
    .max(10, { message: '您最多使用 10 组关键词' }),
  page: z.number().min(1).max(9999999),
  limit: z.number().min(1).max(24)
})
