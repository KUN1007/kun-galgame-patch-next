import { z } from 'zod'
import { kunUsernameRegex, kunPasswordRegex } from '~/utils/validate'

export const loginSchema = z.object({
  name: z
    .string({ message: '用户名应为字符' })
    .email({ message: '请输入合法的邮箱格式, 用户名则应为 1~17 位任意字符' })
    .or(
      z.string().regex(kunUsernameRegex, {
        message: '非法的用户名，用户名为 1~17 位任意字符'
      })
    ),
  password: z.string().regex(kunPasswordRegex, {
    message:
      '非法的密码格式，密码的长度为 6 到 107 位，必须包含至少一个英文字符和一个数字，可以选择性的包含 @!#$%^&*()_-+=\\/ 等特殊字符'
  })
})
