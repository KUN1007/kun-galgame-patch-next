import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '~/prisma'
import { kunParseGetQuery } from '../utils/parseQuery'
import type { PatchCharacterDetail } from '~/types/api/character'

const characterIdSchema = z.object({ characterId: z.coerce.number().min(1) })

export const getCharacterById = async (
  input: z.infer<typeof characterIdSchema>
) => {
  const { characterId } = input
  const char = await prisma.patch_char.findUnique({
    where: { id: characterId }
  })
  if (!char) {
    return '未找到角色'
  }

  const aliases = await prisma.patch_char_alias
    .findMany({ where: { patch_char_id: characterId }, select: { name: true } })
    .then((rows) => rows.map((r) => r.name))

  const patchRelations = await prisma.patch_char_relation.findMany({
    where: { patch_char_id: characterId },
    include: { patch: true }
  })
  const patches = patchRelations.map((pr) => ({
    id: pr.patch.id,
    name_zh_cn: pr.patch.name_zh_cn,
    name_ja_jp: pr.patch.name_ja_jp,
    name_en_us: pr.patch.name_en_us,
    banner: pr.patch.banner
  }))

  return {
    id: char.id,
    image: char.image,
    gender: char.gender,
    role: char.role,
    roles: char.roles,
    name: {
      'zh-cn': char.name_zh_cn,
      'ja-jp': char.name_ja_jp,
      'en-us': char.name_en_us
    },
    description: {
      'zh-cn': char.description_zh_cn,
      'ja-jp': char.description_ja_jp,
      'en-us': char.description_en_us
    },
    birthday: char.birthday,
    height: char.height,
    weight: char.weight,
    bust: char.bust,
    waist: char.waist,
    hips: char.hips,
    cup: char.cup,
    age: char.age,
    infobox: char.infobox,
    alias: aliases,
    patches: patches.map((p) => ({
      id: p.id,
      name: {
        'zh-cn': p.name_zh_cn,
        'ja-jp': p.name_ja_jp,
        'en-us': p.name_en_us
      },
      banner: p.banner
    }))
  } satisfies PatchCharacterDetail
}

export const GET = async (req: NextRequest) => {
  const input = kunParseGetQuery(req, characterIdSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }

  const res = await getCharacterById(input)
  return NextResponse.json(res)
}
