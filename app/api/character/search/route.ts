import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '~/prisma/index'
import { searchCharSchema } from '~/validations/char'
import { kunParsePostBody } from '~/app/api/utils/parseQuery'

export const searchChar = async (input: z.infer<typeof searchCharSchema>) => {
  const { query } = input
  const chars = await prisma.patch_char.findMany({
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
      gender: true,
      role: true,
      roles: true,
      name_zh_cn: true,
      name_ja_jp: true,
      name_en_us: true
    }
  })
  return chars
}

export const POST = async (req: NextRequest) => {
  const input = await kunParsePostBody(req, searchCharSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }
  const response = await searchChar(input)
  return NextResponse.json(response)
}
