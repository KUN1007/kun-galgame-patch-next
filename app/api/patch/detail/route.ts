import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { kunParseGetQuery } from '~/app/api/utils/parseQuery'
import { getNSFWHeader } from '~/app/api/utils/getNSFWHeader'
import { prisma } from '~/prisma/index'
import { markdownToHtml } from '~/app/api/utils/markdownToHtml'
import type { PatchDetail } from '~/types/api/patch'

const patchIdSchema = z.object({
  patchId: z.coerce.number().min(1).max(9999999)
})

export const getPatchDetail = async (
  input: z.infer<typeof patchIdSchema>,
  nsfwEnable: Record<string, string | undefined>
) => {
  const { patchId } = input

  const patch = await prisma.patch.findUnique({
    where: { id: patchId },
    include: {
      user: true,
      alias: { select: { name: true } },
      cover: true,
      screenshot: true,
      tag: {
        include: {
          tag: true
        }
      },
      company: {
        include: {
          company: true
        }
      },
      release: true,
      char: true,
      person: true
    }
  })
  if (!patch) {
    return '未找到该补丁'
  }

  const detail: PatchDetail = {
    id: patch.id,
    name: patch.name,
    name_en_us: patch.name_en_us,
    name_ja_jp: patch.name_ja_jp,
    name_zh_cn: patch.name_zh_cn,
    banner: patch.banner,
    content_limit: patch.content_limit,
    view: patch.view,
    download: patch.download,
    released: patch.released,
    type: patch.type,
    language: patch.language,
    engine: patch.engine,
    platform: patch.platform,
    alias: patch.alias.map((a) => a.name),
    introduction_zh_cn: await markdownToHtml(patch.introduction_zh_cn),
    introduction_ja_jp: await markdownToHtml(patch.introduction_ja_jp),
    introduction_en_us: await markdownToHtml(patch.introduction_en_us),
    vndbId: patch.vndb_id || '',
    cover: patch.cover,
    screenshot: patch.screenshot.filter(
      (s) => nsfwEnable.content_limit !== 'sfw' || !s.sexual
    ),
    tag: patch.tag
      .map((tr) => ({
        id: tr.tag.id,
        name: tr.tag.name,
        name_en_us: tr.tag.name_en_us,
        category: tr.tag.category,
        spoiler_level: tr.spoiler_level,
        provider: tr.tag.provider,
        count: tr.tag.count
      }))
      .filter(
        (t) => nsfwEnable.content_limit !== 'sfw' || t.category !== 'sexual'
      ),
    company: patch.company.map((cr) => ({
      id: cr.company.id,
      name: cr.company.name,
      logo: cr.company.logo,
      count: cr.company.count
    })),
    release: patch.release.map((r) => ({
      id: r.id,
      rid: r.rid,
      title: r.title,
      released: r.released,
      platforms: r.platforms,
      languages: r.languages,
      minage: r.minage ?? 0
    })),
    char: patch.char.map((c) => ({
      id: c.id,
      image: c.image,
      gender: c.gender,
      role: c.role,
      roles: c.roles,
      name_zh_cn: c.name_zh_cn,
      name_ja_jp: c.name_ja_jp,
      name_en_us: c.name_en_us,
      description_zh_cn: c.description_zh_cn,
      description_ja_jp: c.description_ja_jp,
      description_en_us: c.description_en_us,
      infobox: c.infobox
    })),
    person: patch.person.map((p) => ({
      id: p.id,
      image: p.image,
      roles: p.roles,
      name_zh_cn: p.name_zh_cn,
      name_ja_jp: p.name_ja_jp,
      name_en_us: p.name_en_us,
      description_zh_cn: p.description_zh_cn,
      description_ja_jp: p.description_ja_jp,
      description_en_us: p.description_en_us
    })),
    created: String(patch.created),
    updated: String(patch.updated)
  }

  return detail
}

export const GET = async (req: NextRequest) => {
  const input = kunParseGetQuery(req, patchIdSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }

  const nsfwEnable = getNSFWHeader(req)
  const response = await getPatchDetail(input, nsfwEnable)
  if (typeof response === 'string') {
    return NextResponse.json(response)
  }

  return NextResponse.json(response)
}
