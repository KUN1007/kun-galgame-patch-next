import { z } from 'zod'

export const avatarSchema = z.object({
  avatar: z.any()
})

export const bioSchema = z
  .string()
  .trim()
  .min(1, { message: '您的签名最少需要 1 个字符' })
  .max(107, { message: '签名不能超过 107 个字符' })

export const usernameSchema = z
  .string()
  .trim()
  .min(1, { message: '您的用户名最少需要 1 个字符' })
  .max(17, { message: '用户名长度不能超过 17 个字符' })
