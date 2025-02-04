import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { kunParseGetQuery } from '~/app/api/utils/parseQuery'
import { prisma } from '~/prisma/index'
import { getUserInfoSchema } from '~/validations/user'
import type { UserContribute } from '~/types/api/user'

export const getUserContribute = async (
  input: z.infer<typeof getUserInfoSchema>
) => {
  const { uid, page, limit } = input
  const offset = (page - 1) * limit

  const [data, total] = await Promise.all([
    prisma.user_patch_contribute_relation.findMany({
      where: { user_id: uid },
      include: {
        patch: {
          select: {
            name: true
          }
        }
      },
      orderBy: { created: 'desc' },
      take: limit,
      skip: offset
    }),
    prisma.user_patch_contribute_relation.count({
      where: { user_id: uid }
    })
  ])

  const contributes: UserContribute[] = data.map((gal) => ({
    id: gal.id,
    patchId: gal.patch_id,
    patchName: gal.patch.name,
    created: String(gal.created)
  }))

  return { contributes, total }
}

export const GET = async (req: NextRequest) => {
  const input = kunParseGetQuery(req, getUserInfoSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }

  const response = await getUserContribute(input)
  return NextResponse.json(response)
}
