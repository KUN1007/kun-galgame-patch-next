import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { kunParseGetQuery } from '~/app/api/utils/parseQuery'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'
import { prisma } from '~/prisma/index'
import { adminPaginationSchema } from '~/validations/admin'
import type { AdminLog } from '~/types/api/admin'

export const getLog = async (input: z.infer<typeof adminPaginationSchema>) => {
  const { page, limit } = input
  const offset = (page - 1) * limit

  const [data, total] = await Promise.all([
    await prisma.admin_log.findMany({
      take: limit,
      skip: offset,
      orderBy: { created: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    }),
    await prisma.patch.count()
  ])

  const logs: AdminLog[] = data.map((log) => ({
    id: log.id,
    type: log.type,
    user: log.user,
    content: log.content,
    created: log.created
  }))

  return { logs, total }
}

export async function GET(req: NextRequest) {
  const input = kunParseGetQuery(req, adminPaginationSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }
  const payload = await verifyHeaderCookie(req)
  if (!payload) {
    return NextResponse.json('用户未登录')
  }
  if (payload.role < 3) {
    return NextResponse.json('杂鱼~本页面仅管理员可访问')
  }

  const res = await getLog(input)
  return NextResponse.json(res)
}
