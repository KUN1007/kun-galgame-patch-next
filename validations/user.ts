import { z } from 'zod'

export const bioSchema = z
  .string()
  .trim()
  .min(1, { message: '您的签名最少需要 1 个字符' })
  .max(107, { message: '签名不能超过 107 个字符' })
