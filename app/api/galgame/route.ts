import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { kunParseGetQuery } from '../utils/parseQuery'
import { prisma } from '~/prisma/index'
import { galgameSchema } from '~/validations/galgame'
import { ALL_SUPPORTED_TYPE } from '~/constants/resource'

export const getGalgame = async (input: z.infer<typeof galgameSchema>) => {
  const { selectedType, sortField, sortOrder, page, limit } = input

  const offset = (page - 1) * limit

  const typeQuery =
    selectedType === 'all' ? {} : { type: { has: selectedType } }

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

export const GET = async (req: NextRequest) => {
  const input = kunParseGetQuery(req, galgameSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }
  if (!ALL_SUPPORTED_TYPE.includes(input.selectedType)) {
    return NextResponse.json('请选择我们支持的 Galgame 类型')
  }

  const response = await getGalgame(input)
  return NextResponse.json(response)
}
