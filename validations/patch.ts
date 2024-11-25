import { z } from 'zod'
import { ResourceSizeRegex } from '~/utils/validate'
import {
  SUPPORTED_TYPES,
  SUPPORTED_LANGUAGES,
  SUPPORTED_PLATFORMS
} from '~/constants/resource'

export const patchTagChangeSchema = z.object({
  patchId: z.number({ message: '补丁 ID 必须为数字' }).min(1).max(9999999),
  tagId: z
    .array(z.number({ message: '标签 ID 必须为数字' }).min(1).max(9999999))
    .min(1)
    .max(107, { message: '一个补丁最多有 107 个标签' })
})

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
    .max(10, { message: '您的单个补丁资源最多有 10 条链接' }),
  size: z
    .string()
    .trim()
    .regex(ResourceSizeRegex, { message: '请选择资源的大小, MB 或 GB' }),
  code: z
    .string()
    .trim()
    .min(1)
    .max(1007, { message: '资源提取码长度最多 1007 位' }),
  password: z
    .string()
    .trim()
    .min(1)
    .max(1007, { message: '资源解压码长度最多 1007 位' }),
  note: z
    .string()
    .trim()
    .min(1)
    .max(10007, { message: '资源备注最多 10007 字' }),
  type: z
    .array(z.string())
    .min(1, { message: '请选择至少一个资源类型' })
    .max(10, { message: '您的单个补丁资源最多有 10 条链接' })
    .refine((types) => types.every((type) => SUPPORTED_TYPES.includes(type)), {
      message: '非法的补丁类型'
    }),
  language: z
    .array(z.string())
    .min(1, { message: '请选择至少一个资源语言' })
    .max(10, { message: '您的单个补丁资源最多有 10 个语言' })
    .refine(
      (types) => types.every((type) => SUPPORTED_LANGUAGES.includes(type)),
      {
        message: '非法的补丁语言'
      }
    ),
  platform: z
    .array(z.string())
    .min(1, { message: '请选择至少一个资源平台' })
    .max(10, { message: '您的单个补丁资源最多有 10 个平台' })
    .refine(
      (types) => types.every((type) => SUPPORTED_PLATFORMS.includes(type)),
      {
        message: '非法的补丁平台'
      }
    )
})

export const patchResourceUpdateSchema = patchResourceCreateSchema.merge(
  z.object({
    resourceId: z.number().min(1).max(9999999)
  })
)

export const declinePullRequestSchema = z.object({
  prId: z.number({ message: '补丁 ID 必须为数字' }).min(1).max(9999999),
  note: z
    .string({ message: '必须填写拒绝原因' })
    .trim()
    .min(1)
    .max(1007, { message: '拒绝原因最多 1007 个字符' })
})

export const updatePatchBannerSchema = z.object({
  patchId: z.number().min(1).max(9999999),
  image: z.any()
})

export const getPatchHistorySchema = z.object({
  patchId: z.number({ message: '补丁 ID 必须为数字' }).min(1).max(9999999),
  page: z.number().min(1).max(9999999),
  limit: z.number().min(1).max(30)
})
