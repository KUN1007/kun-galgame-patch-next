import { z } from 'zod'
import { MESSAGE_TYPE } from '~/components/message/_message'

export const createMessageSchema = z.object({
  type: z.enum(MESSAGE_TYPE),
  content: z
    .string()
    .url('请输入有效的链接格式')
    .max(1007, { message: '单个链接的长度最大 1007 个字符' }),
  recipientId: z.number().min(1).max(9999999),
  patchId: z.number().min(1).max(9999999).optional(),
  resourceId: z.number().min(1).max(9999999).optional(),
  commentId: z.number().min(1).max(9999999).optional()
})

export const getMessageSchema = z.object({
  type: z.enum(MESSAGE_TYPE),
  page: z.number().min(1).max(9999999),
  limit: z.number().min(1).max(30)
})
