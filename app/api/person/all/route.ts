import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '~/prisma/index'
import { getPersonSchema } from '~/validations/person'
import { kunParseGetQuery } from '~/app/api/utils/parseQuery'
import type { PatchPerson } from '~/types/api/person'

export const getPerson = async (input: z.infer<typeof getPersonSchema>) => {
  const { page, limit } = input
  const offset = (page - 1) * limit

  const [data, total] = await Promise.all([
    prisma.patch_person.findMany({
      take: limit,
      skip: offset,
      select: {
        id: true,
        image: true,
        roles: true,
        name_zh_cn: true,
        name_ja_jp: true,
        name_en_us: true
      },
      orderBy: { id: 'desc' }
    }),
    prisma.patch_person.count()
  ])

  const persons: PatchPerson[] = data.map((p) => ({
    id: p.id,
    image: p.image,
    roles: p.roles,
    name: {
      'zh-cn': p.name_zh_cn,
      'ja-jp': p.name_ja_jp,
      'en-us': p.name_en_us
    }
  }))

  return { persons, total }
}

export const GET = async (req: NextRequest) => {
  const input = kunParseGetQuery(req, getPersonSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }

  const response = await getPerson(input)
  return NextResponse.json(response)
}
