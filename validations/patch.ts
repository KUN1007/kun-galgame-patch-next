import { z } from 'zod'

export const patchCommentSchema = z.object({
  patchId: z
    .number()
    .min(1, { message: '错误的补丁序号, 补丁序号最小为 1' })
    .max(1000007, { message: '错误的补丁序号, 补丁序号最大为 1000007' }),
  parentId: z
    .number()
    .min(1, { message: '错误的父评论序号, 父评论序号最小为 1' })
    .max(1000007, { message: '错误的父评论序号, 父评论序号最大为 1000007' })
    .nullable(),
  content: z
    .string()
    .trim()
    .min(1, { message: '评论的内容最少为 1 个字符' })
    .max(10007, { message: '评论的内容最多为 10007 个字符' })
})
