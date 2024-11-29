import { z } from 'zod'

export const adminPaginationSchema = z.object({
  page: z.number().min(1).max(9999999),
  limit: z.number().min(1).max(100)
})

export const agreeCreatorSchema = z.object({
  messageId: z.number().min(1).max(9999999)
})

export const declineCreatorSchema = agreeCreatorSchema.merge(
  z.object({
    reason: z
      .string()
      .trim()
      .min(1)
      .max(1007, { message: '拒绝理由最多 1007 个字符' })
  })
)
