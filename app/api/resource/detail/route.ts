import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { kunParseGetQuery } from '~/app/api/utils/parseQuery'
import { markdownToHtml } from '~/app/api/utils/markdownToHtml'
import { prisma } from '~/prisma/index'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'
import type { PatchResource, PatchResourceDetail } from '~/types/api/resource'

const resourcePreviewInclude = {
  patch: {
    select: {
      id: true,
      name_en_us: true,
      name_ja_jp: true,
      name_zh_cn: true
    }
  },
  user: {
    include: {
      _count: {
        select: { patch_resource: true }
      }
    }
  },
  _count: {
    select: { like_by: true }
  }
} satisfies Parameters<typeof prisma.patch_resource.findMany>[0]['include']

const mapPreviewResource = (resource: {
  id: number
  storage: string
  name: string
  model_name: string
  size: string
  type: string[]
  language: string[]
  platform: string[]
  note: string
  download: number
  patch_id: number
  created: Date
  patch: {
    name_en_us: string
    name_ja_jp: string
    name_zh_cn: string
  }
  user: {
    id: number
    name: string
    avatar: string
    _count: {
      patch_resource: number
    }
  }
  _count: {
    like_by: number
  }
}): PatchResource => ({
  id: resource.id,
  storage: resource.storage,
  name: resource.name,
  modelName: resource.model_name,
  size: resource.size,
  type: resource.type,
  language: resource.language,
  platform: resource.platform,
  note: resource.note,
  likeCount: resource._count.like_by,
  download: resource.download,
  patchId: resource.patch_id,
  patchName: {
    'zh-cn': resource.patch.name_zh_cn,
    'ja-jp': resource.patch.name_ja_jp,
    'en-us': resource.patch.name_en_us
  },
  created: String(resource.created),
  user: {
    id: resource.user.id,
    name: resource.user.name,
    avatar: resource.user.avatar,
    patchCount: resource.user._count.patch_resource
  }
})

const resourceIdSchema = z.object({
  resourceId: z.coerce
    .number({ message: '资源 ID 必须为数字' })
    .min(1)
    .max(9999999)
})

export const getPatchResourceDetail = async (
  input: z.infer<typeof resourceIdSchema>,
  uid: number
) => {
  const { resourceId } = input

  const resource = await prisma.patch_resource.findFirst({
    where: { id: resourceId },
    include: {
      user: {
        include: {
          _count: {
            select: { patch_resource: true }
          }
        }
      },
      _count: {
        select: { like_by: true }
      },
      like_by: {
        where: {
          user_id: uid
        }
      },
      patch: {
        include: {
          alias: true,
          company: {
            include: {
              company: true
            }
          },
          _count: {
            select: {
              favorite_by: true,
              contribute_by: true,
              resource: true,
              comment: true
            }
          }
        }
      }
    }
  })
  if (!resource || !resource.patch) {
    return '未找到对应的资源'
  }

  const samePatchResources = await prisma.patch_resource.findMany({
    where: {
      patch_id: resource.patch_id,
      id: { not: resourceId },
      status: 0
    },
    orderBy: { download: 'desc' },
    take: 5,
    include: resourcePreviewInclude
  })

  let recommendationsRaw = samePatchResources

  if (recommendationsRaw.length < 5) {
    const extraCandidates = await prisma.patch_resource.findMany({
      where: {
        id: { not: resourceId },
        patch_id: { not: resource.patch_id },
        status: 0,
        download: { gt: 500 }
      },
      take: 20,
      include: resourcePreviewInclude
    })

    const uniqueExtras = extraCandidates.filter(
      (candidate) =>
        !recommendationsRaw.some((existing) => existing.id === candidate.id)
    )
    const needed = 5 - recommendationsRaw.length
    const shuffledExtras = uniqueExtras
      .sort(() => Math.random() - 0.5)
      .slice(0, needed)
    recommendationsRaw = [...recommendationsRaw, ...shuffledExtras]
  }

  const recommendations = recommendationsRaw.slice(0, 5).map(mapPreviewResource)

  const detail: PatchResourceDetail = {
    resource: {
      id: resource.id,
      storage: resource.storage,
      name: resource.name,
      modelName: resource.model_name,
      size: resource.size,
      type: resource.type,
      language: resource.language,
      note: resource.note,
      noteHtml: await markdownToHtml(resource.note),
      hash: resource.hash,
      content: resource.content,
      code: resource.code,
      password: resource.password,
      platform: resource.platform,
      likeCount: resource._count.like_by,
      isLike: resource.like_by.length > 0,
      download: resource.download,
      status: resource.status,
      userId: resource.user_id,
      patchId: resource.patch_id,
      created: String(resource.created),
      updateTime: resource.update_time,
      user: {
        id: resource.user.id,
        name: resource.user.name,
        avatar: resource.user.avatar,
        patchCount: resource.user._count.patch_resource
      }
    },
    patch: {
      id: resource.patch.id,
      name: {
        'zh-cn': resource.patch.name_zh_cn,
        'ja-jp': resource.patch.name_ja_jp,
        'en-us': resource.patch.name_en_us
      },
      banner: resource.patch.banner,
      view: resource.patch.view,
      download: resource.patch.download,
      type: resource.patch.type,
      language: resource.patch.language,
      platform: resource.patch.platform,
      content_limit: resource.patch.content_limit,
      released: resource.patch.released,
      created: resource.patch.created,
      alias: resource.patch.alias.map((alias) => alias.name),
      company: resource.patch.company.map((companyRelation) => ({
        id: companyRelation.company.id,
        name: companyRelation.company.name,
        logo: companyRelation.company.logo,
        count: companyRelation.company.count
      })),
      _count: resource.patch._count
    },
    recommendations
  }

  return detail
}

export const GET = async (req: NextRequest) => {
  const input = kunParseGetQuery(req, resourceIdSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }

  const payload = await verifyHeaderCookie(req)

  const response = await getPatchResourceDetail(input, payload?.uid ?? 0)
  return NextResponse.json(response)
}
