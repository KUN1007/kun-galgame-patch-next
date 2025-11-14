import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { kunParseGetQuery } from '../utils/parseQuery'
import { prisma } from '~/prisma/index'
import { galgameSchema } from '~/validations/galgame'
import { ALL_SUPPORTED_TYPE } from '~/constants/resource'
import { GalgameCardSelectField } from '~/constants/api/select'
import { getNSFWHeader } from '~/app/api/utils/getNSFWHeader'

export const getGalgame = async (
  input: z.infer<typeof galgameSchema>,
  nsfwEnable: Record<string, string | undefined>
) => {
  const { selectedType, sortField, sortOrder, page, limit } = input
  const years = JSON.parse(input.yearString) as string[]
  const months = JSON.parse(input.monthString) as string[]

  const offset = (page - 1) * limit

  const typeQuery =
    selectedType === 'all' ? {} : { type: { has: selectedType } }

  let dateFilter = {}
  if (!years.includes('all')) {
    const dateConditions = []

    if (years.includes('future')) {
      dateConditions.push({ released: 'future' })
    }

    if (years.includes('unknown')) {
      dateConditions.push({ released: 'unknown' })
    }

    const nonFutureYears = years.filter((year) => year !== 'future')
    if (nonFutureYears.length > 0) {
      if (!months.includes('all')) {
        const yearMonthConditions = nonFutureYears.flatMap((year) =>
          months.map((month) => ({
            released: {
              startsWith: `${year}-${month}`
            }
          }))
        )
        dateConditions.push(...yearMonthConditions)
      } else {
        const yearConditions = nonFutureYears.map((year) => ({
          released: {
            startsWith: year
          }
        }))
        dateConditions.push(...yearConditions)
      }
    }

    if (dateConditions.length > 0) {
      dateFilter = { OR: dateConditions }
    }
  }

  const [data, total] = await Promise.all([
    prisma.patch.findMany({
      take: limit,
      skip: offset,
      orderBy: { [sortField]: sortOrder },
      where: {
        ...typeQuery,
        ...dateFilter,
        ...nsfwEnable
      },
      select: GalgameCardSelectField
    }),
    prisma.patch.count({
      where: {
        ...typeQuery,
        ...dateFilter,
        ...nsfwEnable
      }
    })
  ])

  const galgames: GalgameCard[] = data.map((g) => ({
    ...g,
    name: {
      'en-us': g.name_en_us,
      'ja-jp': g.name_ja_jp,
      'zh-cn': g.name_zh_cn
    }
  }))

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

  const nsfwEnable = getNSFWHeader(req)

  const response = await getGalgame(input, nsfwEnable)
  return NextResponse.json(response)
}
