import { z } from 'zod'

export const getCharSchema = z.object({
  page: z.coerce.number().min(1).max(9999999),
  limit: z.coerce.number().min(1).max(100)
})

export const getCharByIdSchema = z.object({
  charId: z.coerce.number().min(1).max(9999999)
})

export const searchCharSchema = z.object({
  query: z.array(z.string().trim().min(1).max(107)).min(1).max(10)
})
