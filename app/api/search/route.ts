import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { kunParsePostBody } from '~/app/api/utils/parseQuery'
import { prisma } from '~/prisma/index'
import { searchSchema } from '~/validations/search'
import { GalgameCardSelectField } from '~/constants/api/select'
import { Prisma } from '@prisma/client'

export const searchGalgame = async (input: z.infer<typeof searchSchema>) => {
  const { query, page, limit, searchOption } = input
  const offset = (page - 1) * limit
  const insensitive = Prisma.QueryMode.insensitive

  const data = await prisma.patch.findMany({
    where: {
      AND: query.map((q) => ({
        OR: [
          { name: { contains: q, mode: insensitive } },
          { vndb_id: { contains: q, mode: insensitive } },
          ...(searchOption.searchInIntroduction
            ? [{ introduction: { contains: q, mode: insensitive } }]
            : []),
          ...(searchOption.searchInAlias
            ? [
                {
                  alias: {
                    some: {
                      name: { contains: q, mode: insensitive }
                    }
                  }
                }
              ]
            : []),
          ...(searchOption.searchInTag
            ? [
                {
                  tag: {
                    some: {
                      tag: { name: { contains: q, mode: insensitive } }
                    }
                  }
                }
              ]
            : [])
        ]
      }))
    },
    select: GalgameCardSelectField,
    orderBy: { created: 'desc' },
    take: limit,
    skip: offset
  })

  const total = await prisma.patch.count({
    where: {
      AND: query.map((q) => ({
        OR: [
          { name: { contains: q, mode: insensitive } },
          { vndb_id: { contains: q, mode: insensitive } },
          ...(searchOption.searchInIntroduction
            ? [{ introduction: { contains: q, mode: insensitive } }]
            : []),
          ...(searchOption.searchInAlias
            ? [
                {
                  alias: {
                    some: {
                      name: { contains: q, mode: insensitive }
                    }
                  }
                }
              ]
            : []),
          ...(searchOption.searchInTag
            ? [
                {
                  tag: {
                    some: {
                      tag: { name: { contains: q, mode: insensitive } }
                    }
                  }
                }
              ]
            : [])
        ]
      }))
    }
  })

  const uniqueGalgames: GalgameCard[] = Array.from(
    data
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
