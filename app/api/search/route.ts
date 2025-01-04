import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { kunParsePostBody } from '~/app/api/utils/parseQuery'
import { prisma } from '~/prisma/index'
import { searchSchema } from '~/validations/search'

export const searchGalgame = async (input: z.infer<typeof searchSchema>) => {
  const { query, page, limit } = input

  const offset = (page - 1) * limit

  const patches = await Promise.all(
    query.map(async (q) =>
      prisma.patch.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { vndb_id: { contains: q, mode: 'insensitive' } },
            { introduction: { contains: q, mode: 'insensitive' } },
            { alias: { has: q } }
          ]
        },
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
        },
        orderBy: { created: 'desc' },
        take: limit,
        skip: offset
      })
    )
  )

  const total = await prisma.patch.count({
    where: {
      OR: query.map((q) => ({
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { vndb_id: { contains: q, mode: 'insensitive' } },
          { introduction: { contains: q, mode: 'insensitive' } },
          { alias: { hasSome: [q] } }
        ]
      }))
    }
  })

  const uniqueGalgames: GalgameCard[] = Array.from(
    patches
      .flat()
      .reduce(
        (map, gal) => map.set(gal.id, gal),
        new Map<number, GalgameCard>()
      )
      .values()
  )

  return { galgames: uniqueGalgames, total }
}

export const POST = async (req: NextRequest) => {
  const input = await kunParsePostBody(req, searchSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }

  const response = await searchGalgame(input)
  return NextResponse.json(response)
}
