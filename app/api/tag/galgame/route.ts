import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { kunParseGetQuery } from '~/app/api/utils/parseQuery'
import { prisma } from '~/prisma/index'
import { getPatchByTagSchema } from '~/validations/tag'
import { GalgameCardSelectField } from '~/constants/api/select'

export const getPatchByTag = async (
  input: z.infer<typeof getPatchByTagSchema>
) => {
  const { tagId, page, limit } = input
  const offset = (page - 1) * limit

  const [data, total] = await Promise.all([
    prisma.patch_tag_relation.findMany({
      where: { tag_id: tagId },
      select: {
        patch: {
          select: GalgameCardSelectField
        }
      },
      orderBy: { created: 'desc' },
      take: limit,
      skip: offset
    }),
    prisma.patch_tag_relation.count({
      where: { tag_id: tagId }
    })
  ])

  const galgames = data.map((p) => p.patch)

  return { galgames, total }
}

export const GET = async (req: NextRequest) => {
  const input = kunParseGetQuery(req, getPatchByTagSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }

  const response = await getPatchByTag(input)
  return NextResponse.json(response)
}
