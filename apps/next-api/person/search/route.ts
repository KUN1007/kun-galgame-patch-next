import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '~/prisma/index'
import { searchPersonSchema } from '~/validations/person'
import { kunParsePostBody } from '~/app/api/utils/parseQuery'

export const searchPerson = async (
  input: z.infer<typeof searchPersonSchema>
) => {
  const { query } = input
  const persons = await prisma.patch_person.findMany({
    where: {
      OR: query.map((term) => ({
        OR: [
          { name_zh_cn: { contains: term } },
          { name_ja_jp: { contains: term } },
          { name_en_us: { contains: term } },
          { alias: { some: { name: { contains: term } } } }
        ]
      }))
    },
    take: 100,
    select: {
      id: true,
      image: true,
      roles: true,
      name_zh_cn: true,
      name_ja_jp: true,
      name_en_us: true
    }
  })
  return persons
}

export const POST = async (req: NextRequest) => {
  const input = await kunParsePostBody(req, searchPersonSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }
  const response = await searchPerson(input)
  return NextResponse.json(response)
}
