import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '~/prisma/index'
import { getPersonSchema } from '~/validations/person'
import { kunParseGetQuery } from '~/app/api/utils/parseQuery'

export const getPerson = async (input: z.infer<typeof getPersonSchema>) => {
  const { page, limit } = input
  const offset = (page - 1) * limit

  const [persons, total] = await Promise.all([
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
