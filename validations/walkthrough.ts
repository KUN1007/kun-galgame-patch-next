import { z } from 'zod'

export const createWalkthroughSchema = z.object({
  patchId: z.coerce.number().min(1).max(9999999),
  name: z.string().min(1).max(233, { message: '攻略标题最多 233 字' }),
  content: z.string().min(1).max(100007, { message: '攻略内容最多 100007 字' })
})

export const updateWalkthroughSchema = z.object({
  walkthroughId: z.coerce.number().min(1).max(9999999),
  name: z.string().min(1).max(233, { message: '攻略标题最多 233 字' }),
  content: z.string().min(1).max(100007, { message: '攻略内容最多 100007 字' })
})
