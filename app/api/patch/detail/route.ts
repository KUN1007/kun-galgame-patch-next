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
      alias: true,
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
      char_rel: { include: { char: true } },
      person_rel: { include: { person: true } }
    }
  })
  if (!patch) {
    return '未找到该补丁'
  }

  const detail: PatchDetail = {
    id: patch.id,
    bid: patch.bid || 0,
    name: {
      'zh-cn': patch.name_zh_cn,
      'ja-jp': patch.name_ja_jp,
      'en-us': patch.name_en_us
    },
    banner: patch.banner,
    content_limit: patch.content_limit,
    view: patch.view,
    download: patch.download,
    released: patch.released,
    type: patch.type,
    language: patch.language,
    engine: patch.engine,
    platform: patch.platform,
    alias: patch.alias.map((a) => ({
      id: a.id,
      name: a.name
    })),
    introduction: {
      'zh-cn': await markdownToHtml(patch.introduction_zh_cn),
      'ja-jp': await markdownToHtml(patch.introduction_ja_jp),
      'en-us': await markdownToHtml(patch.introduction_en_us)
    },
    vndbId: patch.vndb_id || '',
    cover: patch.cover,
    screenshot: patch.screenshot.map((s) => ({
      id: s.id,
      image_id: s.image_id,
      url: s.url,
      width: s.width,
      height: s.height,
      sexual: s.sexual,
      violence: s.violence,
      thumbnail_url: s.thumbnail_url,
      thumb_width: s.thumb_width,
      thumb_height: s.thumb_height,
      order_no: s.order_no
    })),
    tag: patch.tag
      .map((tr) => ({
        id: tr.tag.id,
        name: {
          'zh-cn': tr.tag.name,
          'ja-jp': '',
          'en-us': tr.tag.name_en_us
        },
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
    char: patch.char_rel
      .map((cr) => cr.char)
      .map((c) => ({
        id: c.id,
        image: c.image,
        gender: c.gender,
        role: c.role,
        roles: c.roles,
        name: {
          'zh-cn': c.name_zh_cn,
          'ja-jp': c.name_ja_jp,
          'en-us': c.name_en_us
        },
        infobox: c.infobox
      })),
    person: patch.person_rel
      .map((pr) => pr.person)
      .map((p) => ({
        id: p.id,
        image: p.image,
        roles: p.roles,
        name: {
          'zh-cn': p.name_zh_cn,
          'ja-jp': p.name_ja_jp,
          'en-us': p.name_en_us
        }
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
