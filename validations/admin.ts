import { z } from 'zod'
import { bioSchema, usernameSchema } from './user'

export const adminPaginationSchema = z.object({
  page: z.number().min(1).max(9999999),
  limit: z.number().min(1).max(100)
})

export const adminUpdateUserSchema = z.object({
  uid: z.number().min(1).max(9999999),
  name: usernameSchema,
  role: z.number().min(1).max(3),
  status: z.number().min(0).max(2),
  dailyImageCount: z.number().min(0).max(50),
  bio: bioSchema
})

export const approveCreatorSchema = z.object({
  messageId: z.number().min(1).max(9999999)
})

export const declineCreatorSchema = approveCreatorSchema.merge(
  z.object({
    reason: z
      .string()
      .trim()
      .min(1)
      .max(1007, { message: '拒绝理由最多 1007 个字符' })
  })
)
