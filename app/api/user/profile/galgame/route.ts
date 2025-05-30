import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { kunParseGetQuery } from '~/app/api/utils/parseQuery'
import { prisma } from '~/prisma/index'
import { getUserInfoSchema } from '~/validations/user'
import { GalgameCardSelectField } from '~/constants/api/select'

export const getUserGalgame = async (
  input: z.infer<typeof getUserInfoSchema>
) => {
  const { uid, page, limit } = input
  const offset = (page - 1) * limit

  const [galgames, total] = await Promise.all([
    prisma.patch.findMany({
      where: { user_id: uid },
      select: GalgameCardSelectField,
      orderBy: { created: 'desc' },
      take: limit,
      skip: offset
    }),
    prisma.patch.count({
      where: { user_id: uid }
    })
  ])

  return { galgames, total }
}

export const GET = async (req: NextRequest) => {
  const input = kunParseGetQuery(req, getUserInfoSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }

  const response = await getUserGalgame(input)
  return NextResponse.json(response)
}
