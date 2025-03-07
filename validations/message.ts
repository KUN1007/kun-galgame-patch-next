import { z } from 'zod'
import { MESSAGE_TYPE } from '~/constants/message'

export const createMessageSchema = z.object({
  type: z.enum(MESSAGE_TYPE),
  content: z
    .string()
    .url('请输入有效的链接格式')
    .max(1007, { message: '单个链接的长度最大 1007 个字符' }),
  recipientId: z.coerce.number().min(1).max(9999999),
  link: z.string().max(1007)
})

export const getMessageSchema = z.object({
  type: z.enum(MESSAGE_TYPE).optional(),
  page: z.coerce.number().min(1).max(9999999),
  limit: z.coerce.number().min(1).max(30)
})
