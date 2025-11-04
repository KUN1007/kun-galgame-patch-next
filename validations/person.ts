import { z } from 'zod'

export const getPersonSchema = z.object({
  page: z.coerce.number().min(1).max(9999999),
  limit: z.coerce.number().min(1).max(100)
})

export const getPersonByIdSchema = z.object({
  personId: z.coerce.number().min(1).max(9999999)
})

export const searchPersonSchema = z.object({
  query: z.array(z.string().trim().min(1).max(107)).min(1).max(10)
})
