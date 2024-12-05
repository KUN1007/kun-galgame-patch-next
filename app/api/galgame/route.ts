import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { kunParsePostBody } from '../utils/parseQuery'
import { prisma } from '~/prisma/index'
import { galgameSchema } from '~/validations/galgame'

export const getGalgame = async (input: z.infer<typeof galgameSchema>) => {
  const { selectedTypes, sortField, sortOrder, page, limit } = input

  const offset = (page - 1) * limit

  const isSelectAll = !selectedTypes.length || selectedTypes.includes('all')
  const typeQuery = isSelectAll
    ? {}
    : {
        type: {
          hasSome: selectedTypes
        }
      }

  const [galgames, total] = await Promise.all([
    await prisma.patch.findMany({
      take: limit,
      skip: offset,
      orderBy: { [sortField]: sortOrder },
      where: typeQuery,
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
    }),
    await prisma.patch.count({
      where: typeQuery
    })
  ])

  return { galgames, total }
}

export const POST = async (req: NextRequest) => {
  const input = await kunParsePostBody(req, galgameSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }

  const response = await getGalgame(input)
  return NextResponse.json(response)
}
