import { z } from 'zod'
import {
  kunUsernameRegex,
  kunPasswordRegex,
  kunValidMailConfirmCodeRegex
} from '~/utils/validate'

export const loginSchema = z.object({
  name: z
    .string()
    .trim()
    .email({ message: '请输入合法的邮箱格式, 用户名则应为 1~17 位任意字符' })
    .or(
      z.string().trim().regex(kunUsernameRegex, {
        message: '非法的用户名，用户名为 1~17 位任意字符'
      })
    ),
  password: z.string().trim().regex(kunPasswordRegex, {
    message:
      '非法的密码格式，密码的长度为 6 到 1007 位，必须包含至少一个英文字符和一个数字，可以选择性的包含 @!#$%^&*()_-+=\\/ 等特殊字符'
  }),
  captcha: z
    .string()
    .trim()
    .min(10, { message: '非法的人机验证码格式' })
    .max(10)
})

export const registerSchema = z.object({
  name: z.string().regex(kunUsernameRegex, {
    message: '非法的用户名，用户名为 1~17 位任意字符'
  }),
  email: z
    .string()
    .email({ message: '请输入合法的邮箱格式' })
    .or(
      z.string().regex(kunUsernameRegex, {
        message: '非法的用户名，用户名为 1~17 位任意字符'
      })
    ),
  code: z.string().regex(kunValidMailConfirmCodeRegex, {
    message: '非法的邮箱验证码，验证码为 7 位数字和大小写字母组合'
  }),
  password: z.string().trim().regex(kunPasswordRegex, {
    message:
      '非法的密码格式，密码的长度为 6 到 1007 位，必须包含至少一个英文字符和一个数字，可以选择性的包含 @!#$%^&*()_-+=\\/ 等特殊字符'
  })
})

export const sendRegisterEmailVerificationCodeSchema = z.object({
  name: z.string().regex(kunUsernameRegex, {
    message: '非法的用户名，用户名为 1~17 位任意字符'
  }),
  email: z
    .string()
    .email({ message: '请输入合法的邮箱格式' })
    .or(
      z.string().regex(kunUsernameRegex, {
        message: '非法的用户名，用户名为 1~17 位任意字符'
      })
    ),
  captcha: z
    .string()
    .trim()
    .min(10, { message: '非法的人机验证码格式' })
    .max(10)
})

export const captchaSchema = z.object({
  sessionId: z.string().trim().uuid({ message: '非法的 sessionId 格式' }),
  selectedIds: z
    .array(z.string().trim().uuid({ message: '非法的验证图片 ID' }))
    .min(1, { message: '验证图片中最少有一只白毛小只可爱软萌妹子' })
    .max(3, { message: '验证图片中最多有三只白毛小只可爱软萌妹子' })
})
