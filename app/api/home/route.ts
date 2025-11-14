import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '~/prisma/index'
import { markdownToText } from '~/utils/markdownToText'
import { HomeComment, HomeResource } from '~/types/api/home'
import { GalgameCardSelectField } from '~/constants/api/select'
import { getNSFWHeader } from '~/app/api/utils/getNSFWHeader'

export const getHomeData = async (
  nsfwEnable: Record<string, string | undefined>
) => {
  const [galgamesData, resourcesData, commentsData] = await Promise.all([
    prisma.patch.findMany({
      orderBy: { created: 'desc' },
      where: nsfwEnable,
      select: GalgameCardSelectField,
      take: 12
    }),
    prisma.patch_resource.findMany({
      orderBy: { created: 'desc' },
      where: { patch: nsfwEnable },
      include: {
        patch: {
          select: {
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
          select: {
            like_by: true
          }
        }
      },
      take: 6
    }),
    prisma.patch_comment.findMany({
      orderBy: { created: 'desc' },
      include: {
        patch: {
          select: {
            name_en_us: true,
            name_ja_jp: true,
            name_zh_cn: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        _count: {
          select: {
            like_by: true
          }
        }
      },
      take: 6
    })
  ])

  const galgames: GalgameCard[] = galgamesData.map((g) => ({
    ...g,
    name: {
      'en-us': g.name_en_us,
      'ja-jp': g.name_ja_jp,
      'zh-cn': g.name_zh_cn
    }
  }))

  const resources: HomeResource[] = resourcesData.map((resource) => ({
    id: resource.id,
    storage: resource.storage,
    name: resource.name,
    modelName: resource.model_name,
    size: resource.size,
    type: resource.type,
    language: resource.language,
    note: markdownToText(resource.note).slice(0, 233),
    platform: resource.platform,
    likeCount: resource._count.like_by,
    download: resource.download,
    patchId: resource.patch_id,
    patchName: {
      'en-us': resource.patch.name_en_us,
      'ja-jp': resource.patch.name_ja_jp,
      'zh-cn': resource.patch.name_zh_cn
    },
    created: String(resource.created),
    user: {
      id: resource.user.id,
      name: resource.user.name,
      avatar: resource.user.avatar,
      patchCount: resource.user._count.patch_resource
    }
  }))

  const comments: HomeComment[] = commentsData.map((comment) => ({
    id: comment.id,
    user: comment.user,
    content: markdownToText(comment.content).slice(0, 233),
    patchName: {
      'en-us': comment.patch.name_en_us,
      'ja-jp': comment.patch.name_ja_jp,
      'zh-cn': comment.patch.name_zh_cn
    },
    patchId: comment.patch_id,
    like: comment._count.like_by,
    created: comment.created
  }))

  return { galgames, resources, comments }
}

export const GET = async (req: NextRequest) => {
  const nsfwEnable = getNSFWHeader(req)

  const response = await getHomeData(nsfwEnable)
  return NextResponse.json(response)
}
