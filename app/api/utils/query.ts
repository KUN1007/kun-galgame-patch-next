import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'

// 定义查询参数的 Zod Schema
const QuerySchema = z.object({
  page: z.number().min(1, 'Page must be at least 1').optional(),
  pageSize: z.number().min(1, 'Page size must be at least 1').optional(),
  deleted: z.boolean().optional(),
  id: z.string().uuid().optional(),
  name: z.string().min(1).optional(),
  work_count: z.number().optional(),
  created_time: z.string().optional()
})

export const kunParseQueryParams = (req: NextRequest) => {
  const { searchParams } = new URL(req.url)
  const queryParams = Object.fromEntries(searchParams.entries())
  const verifyRes = QuerySchema.safeParse(queryParams)

  if (!verifyRes.success) {
    return verifyRes.error.message
  }

  return verifyRes.data
}
