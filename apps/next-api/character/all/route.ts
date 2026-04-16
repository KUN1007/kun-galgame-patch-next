import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '~/prisma/index'
import { getCharSchema } from '~/validations/char'
import { kunParseGetQuery } from '~/app/api/utils/parseQuery'
import type { PatchCharacter } from '~/types/api/character'

export const getChar = async (input: z.infer<typeof getCharSchema>) => {
  const { page, limit } = input
  const offset = (page - 1) * limit
  const [data, total] = await Promise.all([
    prisma.patch_char.findMany({
      take: limit,
      skip: offset,
      select: {
        id: true,
        image: true,
        gender: true,
        role: true,
        roles: true,
        name_zh_cn: true,
        name_ja_jp: true,
        name_en_us: true
      },
      orderBy: { id: 'desc' }
    }),
    prisma.patch_char.count()
  ])

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

  return { chars, total }
}

export const GET = async (req: NextRequest) => {
  const input = kunParseGetQuery(req, getCharSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }

  const response = await getChar(input)
  return NextResponse.json(response)
}
