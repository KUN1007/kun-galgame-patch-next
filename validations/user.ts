import { z } from 'zod'
import {
  kunPasswordRegex,
  kunValidMailConfirmCodeRegex
} from '~/utils/validate'

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

export const resetEmailSchema = z.object({
  email: z.string().email({ message: '请输入合法的邮箱格式' }),
  code: z
    .string()
    .regex(kunValidMailConfirmCodeRegex, { message: '邮箱验证码格式无效' })
})

export const sendResetEmailVerificationCodeSchema = z.object({
  email: z.string().email({ message: '请输入合法的邮箱格式' })
})

export const passwordSchema = z.object({
  oldPassword: z.string().trim().regex(kunPasswordRegex, {
    message:
      '旧密码格式非法, 密码的长度为 6 到 1007 位，必须包含至少一个英文字符和一个数字，可以选择性的包含 @!#$%^&*()_-+=\\/ 等特殊字符'
  }),
  newPassword: z.string().trim().regex(kunPasswordRegex, {
    message:
      '新密码格式非法, 密码的长度为 6 到 1007 位，必须包含至少一个英文字符和一个数字，可以选择性的包含 @!#$%^&*()_-+=\\/ 等特殊字符'
  })
})
