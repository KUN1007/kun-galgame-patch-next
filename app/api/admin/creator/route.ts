import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { kunParseGetQuery } from '~/app/api/utils/parseQuery'
import { prisma } from '~/prisma/index'
import { adminPaginationSchema } from '~/validations/admin'
import type { AdminCreator } from '~/types/api/admin'

export const getAdminCreator = async (
  input: z.infer<typeof adminPaginationSchema>
) => {
  const { page, limit } = input
  const offset = (page - 1) * limit

  const [data, total] = await Promise.all([
    prisma.user_message.findMany({
      where: { type: 'apply', sender_id: { not: null } },
      take: limit,
      skip: offset,
      orderBy: { created: 'desc' },
      include: {
        sender: {
          include: {
            _count: {
              select: {
                patch_resource: true
              }
            }
          }
        }
      }
    }),
    prisma.user_message.count({
      where: { type: 'apply', sender_id: { not: null } }
    })
  ])

  const creators: AdminCreator[] = data.map((creator) => ({
    id: creator.id,
    content: creator.content,
    status: creator.status,
    sender: {
      id: creator.sender!.id,
      name: creator.sender!.name,
      avatar: creator.sender!.avatar
    },
    patchResourceCount: creator.sender?._count.patch_resource ?? 0,
    created: creator.created
  }))

  return { creators, total }
}

export const GET = async (req: NextRequest) => {
  const input = kunParseGetQuery(req, adminPaginationSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }

  const response = await getAdminCreator(input)
  return NextResponse.json(response)
}
