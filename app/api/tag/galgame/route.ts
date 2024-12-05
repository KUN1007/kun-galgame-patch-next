import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { kunParseGetQuery } from '~/app/api/utils/parseQuery'
import { prisma } from '~/prisma/index'
import { getPatchByTagSchema } from '~/validations/tag'

export const getPatchByTag = async (
  input: z.infer<typeof getPatchByTagSchema>
) => {
  const { tagId, page, limit } = input
  const offset = (page - 1) * limit

  const [data, total] = await Promise.all([
    await prisma.patch_tag_relation.findMany({
      where: { tag_id: tagId },
      select: {
        patch: {
          select: {
            id: true,
            name: true,
            banner: true,
            view: true,
            download: true,
            type: true,
            language: true,
            platform: true,
            created: true,
            _count: {
              select: {
                favorite_by: true,
                contribute_by: true,
                resource: true,
                comment: true
              }
            }
          }
        }
      },
      orderBy: { created: 'desc' },
      take: limit,
      skip: offset
    }),
    await prisma.patch_tag_relation.count({
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
