import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { kunParseGetQuery } from '../utils/parseQuery'
import { prisma } from '~/prisma/index'
import { getReleaseSchema } from '~/validations/release'
import type { GalgameReleaseCard } from '~/types/api/release'

export const getGalgameRelease = async (
  input: z.infer<typeof getReleaseSchema>
) => {
  const { year, month } = input

  const data = await prisma.patch.findMany({
    orderBy: { released: 'desc' },
    where: { released: { startsWith: `${year}-${month}` } },
    select: {
      id: true,
      name_en_us: true,
      name_ja_jp: true,
      name_zh_cn: true,
      banner: true,
      released: true,
      _count: {
        select: {
          resource: true
        }
      }
    }
  })

  const galgames: GalgameReleaseCard[] = data.map((gal) => ({
    patchId: gal.id,
    name: {
      'en-us': gal.name_en_us,
      'ja-jp': gal.name_ja_jp,
      'zh-cn': gal.name_zh_cn
    },
    banner: gal.banner,
    released: gal.released,
    resourceCount: gal._count.resource
  }))

  return galgames
}

export const GET = async (req: NextRequest) => {
  const input = kunParseGetQuery(req, getReleaseSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }

  const response = await getGalgameRelease(input)
  return NextResponse.json(response)
}
