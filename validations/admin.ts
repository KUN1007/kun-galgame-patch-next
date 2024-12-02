import { z } from 'zod'

export const adminPaginationSchema = z.object({
  page: z.coerce.number().min(1).max(9999999),
  limit: z.coerce.number().min(1).max(100)
})

export const adminUpdateUserSchema = z.object({
  uid: z.coerce.number().min(1).max(9999999),
  name: z
    .string()
    .trim()
    .min(1, { message: '您的用户名最少需要 1 个字符' })
    .max(17, { message: '用户名长度不能超过 17 个字符' }),
  role: z.coerce.number().min(1).max(3),
  status: z.coerce.number().min(0).max(2),
  dailyImageCount: z.coerce.number().min(0).max(50),
  bio: z
    .string()
    .trim()
    .min(1, { message: '您的签名最少需要 1 个字符' })
    .max(107, { message: '签名不能超过 107 个字符' })
})

export const approveCreatorSchema = z.object({
  messageId: z.coerce.number().min(1).max(9999999),
  uid: z.coerce.number().min(1).max(9999999)
})

export const declineCreatorSchema = z.object({
  messageId: z.coerce.number().min(1).max(9999999),
  reason: z
    .string()
    .trim()
    .min(1)
    .max(1007, { message: '拒绝理由最多 1007 个字符' })
})
