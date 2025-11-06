import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '~/prisma'
import { kunParseGetQuery } from '../utils/parseQuery'

const personIdSchema = z.object({ personId: z.coerce.number().min(1) })

export const getPersonById = async (input: z.infer<typeof personIdSchema>) => {
  const { personId } = input
  const person = await prisma.patch_person.findUnique({
    where: { id: personId }
  })
  if (!person) return '未找到人物'
  const aliases = await prisma.patch_person_alias
    .findMany({ where: { person_id: personId }, select: { name: true } })
    .then((rows) => rows.map((r) => r.name))
  const patchRelations = await prisma.patch_person_relation.findMany({
    where: { patch_person_id: personId },
    include: { patch: true }
  })
  const patches = patchRelations.map((pr) => ({
    id: pr.patch.id,
    name: pr.patch.name,
    banner: pr.patch.banner
  }))

  return {
    id: person.id,
    image: person.image,
    roles: person.roles,
    language: person.language,
    links: person.links,
    name_zh_cn: person.name_zh_cn,
    name_ja_jp: person.name_ja_jp,
    name_en_us: person.name_en_us,
    description_zh_cn: person.description_zh_cn,
    description_ja_jp: person.description_ja_jp,
    description_en_us: person.description_en_us,
    birthday: person.birthday,
    blood_type: person.blood_type,
    birthplace: person.birthplace,
    office: person.office,
    x: person.x,
    spouse: person.spouse,
    official_website: person.official_website,
    blog: person.blog,
    alias: aliases,
    patches
  }
}

export const GET = async (req: NextRequest) => {
  const input = kunParseGetQuery(req, personIdSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }
  const res = await getPersonById(input)
  return NextResponse.json(res)
}
