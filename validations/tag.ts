import { z } from 'zod'

export const createTagSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1)
    .max(107, { message: '单个标签最大 107 个字符' }),
  introduction: z
    .string()
    .trim()
    .max(10007, { message: '标签的介绍最大 10007 个字符' })
    .optional(),
  alias: z
    .array(
      z
        .string()
        .trim()
        .min(1)
        .max(107, { message: '单个标签的别名最大 107 个字符' })
    )
    .optional()
})
