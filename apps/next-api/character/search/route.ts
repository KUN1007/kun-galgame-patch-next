import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '~/prisma/index'
import { searchCharSchema } from '~/validations/char'
import { kunParsePostBody } from '~/app/api/utils/parseQuery'
import type { PatchCharacter } from '~/types/api/character'

export const searchChar = async (input: z.infer<typeof searchCharSchema>) => {
  const { query } = input
  const data = await prisma.patch_char.findMany({
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

  const chars: PatchCharacter[] = data.map((c) => ({
    id: c.id,
    image: c.image,
    gender: c.gender,
    role: c.role,
    roles: c.roles,
    name: {
      'zh-cn': c.name_zh_cn,
      'ja-jp': c.name_ja_jp,
      'en-us': c.name_en_us
    }
  }))

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
