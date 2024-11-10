import { z } from 'zod'

export const patchCommentSchema = z.object({
  patchId: z.number().min(1).max(9999999),
  parentId: z.number().min(1).max(9999999).nullable(),
  content: z
    .string()
    .trim()
    .min(1, { message: '评论的内容最少为 1 个字符' })
    .max(10007, { message: '评论的内容最多为 10007 个字符' })
})

export const patchCommentUpdateSchema = z.object({
  commentId: z.number().min(1).max(9999999),
  content: z
    .string()
    .trim()
    .min(1, { message: '评论的内容最少为 1 个字符' })
    .max(10007, { message: '评论的内容最多为 10007 个字符' })
})
