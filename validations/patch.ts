import { z } from 'zod'
import { ResourceSizeRegex } from '~/utils/validate'

export const patchCommentCreateSchema = z.object({
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

export const patchResourceCreateSchema = z.object({
  patchId: z.number().min(1).max(9999999),
  link: z
    .array(
      z
        .string()
        .url('请输入有效的链接格式')
        .max(1007, { message: '单个链接的长度最大 1007 个字符' })
    )
    .min(1, { message: '请提供至少一条资源链接' })
    .max(10, { message: '您的单个补丁资源最多有 10 条链接' }),
  size: z
    .string()
    .trim()
    .regex(ResourceSizeRegex, { message: '请选择资源的大小, MB 或 GB' }),
  code: z.string().max(1007, { message: '资源提取码长度最多 1007 位' }),
  password: z.string().max(1007, { message: '资源解压码长度最多 1007 位' }),
  note: z.string().trim().max(10007, { message: '资源备注最多 10007 字' }),
  type: z
    .array(z.string().trim().min(1).max(107))
    .min(1, { message: '请选择至少一个资源类型' })
    .max(10, { message: '您的单个补丁资源最多有 10 条链接' }),
  language: z
    .array(z.string().trim().min(1).max(107))
    .min(1, { message: '请选择至少一个资源语言' })
    .max(10, { message: '您的单个补丁资源最多有 10 个语言' }),
  platform: z
    .array(z.string().trim().min(1).max(107))
    .min(1, { message: '请选择至少一个资源平台' })
    .max(10, { message: '您的单个补丁资源最多有 10 个平台' })
})
