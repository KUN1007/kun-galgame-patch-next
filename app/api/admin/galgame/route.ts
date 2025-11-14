import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { kunParseGetQuery } from '~/app/api/utils/parseQuery'
import { prisma } from '~/prisma/index'
import { adminPaginationSchema } from '~/validations/admin'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'
import type { AdminGalgame } from '~/types/api/admin'

export const getGalgame = async (
  input: z.infer<typeof adminPaginationSchema>
) => {
  const { page, limit, search } = input
  const offset = (page - 1) * limit

  const where = search
    ? {
        name_zh_cn: {
          contains: search,
          mode: 'insensitive' as const
        },
        name_en_us: {
          contains: search,
          mode: 'insensitive' as const
        },
        name_ja_jp: {
          contains: search,
          mode: 'insensitive' as const
        }
      }
    : {}

  const [data, total] = await Promise.all([
    prisma.patch.findMany({
      where,
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
    prisma.patch.count({ where })
  ])

  const galgames: AdminGalgame[] = data.map((galgame) => ({
    id: galgame.id,
    name: {
      'en-us': galgame.name_en_us,
      'ja-jp': galgame.name_ja_jp,
      'zh-cn': galgame.name_zh_cn
    },
    banner: galgame.banner,
    user: galgame.user,
    created: galgame.created
  }))

  return { galgames, total }
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
    return NextResponse.json('本页面仅管理员可访问')
  }

  const res = await getGalgame(input)
  return NextResponse.json(res)
}
