import { z } from 'zod'
import { ResourceSizeRegex } from '~/utils/validate'
import {
  SUPPORTED_TYPE,
  SUPPORTED_LANGUAGE,
  SUPPORTED_PLATFORM,
  SUPPORTED_RESOURCE_LINK
} from '~/constants/resource'

export const patchTagChangeSchema = z.object({
  patchId: z.coerce
    .number({ message: '补丁 ID 必须为数字' })
    .min(1)
    .max(9999999),
  tagId: z
    .array(
      z.coerce.number({ message: '标签 ID 必须为数字' }).min(1).max(9999999)
    )
    .min(1)
    .max(107, { message: '一个补丁最多有 107 个标签' })
})

export const patchCompanyChangeSchema = z.object({
  patchId: z.coerce
    .number({ message: '补丁 ID 必须为数字' })
    .min(1)
    .max(9999999),
  companyId: z
    .array(
      z.coerce.number({ message: '会社 ID 必须为数字' }).min(1).max(9999999)
    )
    .min(1)
    .max(107, { message: '一个补丁最多有 107 个会社' })
})

export const patchCommentCreateSchema = z.object({
  patchId: z.coerce.number().min(1).max(9999999),
  parentId: z.coerce.number().min(1).max(9999999).nullable(),
  content: z
    .string()
    .trim()
    .min(1, { message: '评论的内容最少为 1 个字符' })
    .max(10007, { message: '评论的内容最多为 10007 个字符' }),
  captcha: z.string().trim().max(10, { message: '非法的人机验证码格式' })
})

export const patchCommentUpdateSchema = z.object({
  commentId: z.coerce.number().min(1).max(9999999),
  content: z
    .string()
    .trim()
    .min(1, { message: '评论的内容最少为 1 个字符' })
    .max(10007, { message: '评论的内容最多为 10007 个字符' })
})

export const patchResourceCreateSchema = z.object({
  patchId: z.coerce.number().min(1).max(9999999),
  storage: z.string().refine((type) => SUPPORTED_RESOURCE_LINK.includes(type), {
    message: '非法的资源链接类型'
  }),
  hash: z.string().max(107),
  content: z
    .string()
    .min(1)
    .max(1007, { message: '您的资源链接内容最多 1007 个字符' }),
  size: z
    .string()
    .regex(ResourceSizeRegex, { message: '请选择资源的大小, MB 或 GB' }),
  code: z.string().trim().max(1007, { message: '资源提取码长度最多 1007 位' }),
  password: z.string().max(1007, { message: '资源解压码长度最多 1007 位' }),
  note: z.string().max(10007, { message: '资源备注最多 10007 字' }),
  type: z
    .array(z.string())
    .min(1, { message: '请选择至少一个资源类型' })
    .max(10, { message: '您的单个补丁资源最多有 10 条链接' })
    .refine((types) => types.every((type) => SUPPORTED_TYPE.includes(type)), {
      message: '非法的补丁类型'
    }),
  language: z
    .array(z.string())
    .min(1, { message: '请选择至少一个资源语言' })
    .max(10, { message: '您的单个补丁资源最多有 10 个语言' })
    .refine(
      (types) => types.every((type) => SUPPORTED_LANGUAGE.includes(type)),
      {
        message: '非法的补丁语言'
      }
    ),
  platform: z
    .array(z.string())
    .min(1, { message: '请选择至少一个资源平台' })
    .max(10, { message: '您的单个补丁资源最多有 10 个平台' })
    .refine(
      (types) => types.every((type) => SUPPORTED_PLATFORM.includes(type)),
      {
        message: '非法的补丁平台'
      }
    )
})

export const patchResourceUpdateSchema = patchResourceCreateSchema.merge(
  z.object({
    resourceId: z.coerce.number().min(1).max(9999999)
  })
)

export const declinePullRequestSchema = z.object({
  prId: z.coerce.number({ message: '补丁 ID 必须为数字' }).min(1).max(9999999),
  note: z
    .string({ message: '必须填写拒绝原因' })
    .trim()
    .min(1)
    .max(1007, { message: '拒绝原因最多 1007 个字符' })
})

export const updatePatchBannerSchema = z.object({
  patchId: z.coerce.number().min(1).max(9999999),
  image: z.any()
})

export const getPatchHistorySchema = z.object({
  patchId: z.coerce
    .number({ message: '补丁 ID 必须为数字' })
    .min(1)
    .max(9999999),
  page: z.coerce.number().min(1).max(9999999),
  limit: z.coerce.number().min(1).max(30)
})

export const updatePatchResourceStatsSchema = z.object({
  patchId: z.coerce
    .number({ message: '补丁 ID 必须为数字' })
    .min(1)
    .max(9999999),
  resourceId: z.coerce
    .number({ message: '补丁 ID 必须为数字' })
    .min(1)
    .max(9999999)
})
