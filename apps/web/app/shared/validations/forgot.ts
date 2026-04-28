import { z } from 'zod'

export const stepOneSchema = z.object({
  name: z
    .string()
    .trim()
    .email({ message: '请输入合法的邮箱格式, 用户名则应为 1~17 位任意字符' })
    .or(
      z.string().trim().regex(kunUsernameRegex, {
        message: '非法的用户名，用户名为 1~17 位任意字符'
      })
    )
})

// Field names align with POST /api/v1/auth/forgot/reset (snake_case).
export const stepTwoSchema = z.object({
  name: z
    .string()
    .trim()
    .email({ message: '请输入合法的邮箱格式, 用户名则应为 1~17 位任意字符' })
    .or(
      z.string().trim().regex(kunUsernameRegex, {
        message: '非法的用户名，用户名为 1~17 位任意字符'
      })
    ),
  verification_code: z
    .string()
    .regex(kunValidMailConfirmCodeRegex, { message: '邮箱验证码为 6 位数字' }),
  new_password: z.string().regex(kunPasswordRegex, {
    message:
      '新密码格式错误, 密码的长度为 6 到 1007 位，必须包含至少一个英文字符和一个数字，可以选择性的包含 @!#$%^&*()_-+=\\/ 等特殊字符'
  }),
  confirm_password: z.string().regex(kunPasswordRegex, {
    message:
      '确认密码格式错误, 密码的长度为 6 到 1007 位，必须包含至少一个英文字符和一个数字，可以选择性的包含 @!#$%^&*()_-+=\\/ 等特殊字符'
  })
})
