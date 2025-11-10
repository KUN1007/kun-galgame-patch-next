import { z } from 'zod'
import { prisma } from '~/prisma/index'
import type { PatchHeader } from '~/types/api/patch'

const patchIdSchema = z.object({
  patchId: z.coerce.number().min(1).max(9999999)
})

export const getPatchById = async (
  input: z.infer<typeof patchIdSchema>,
  uid: number
) => {
  const { patchId } = input

  const patch = await prisma.patch.findUnique({
    where: { id: patchId },
    include: {
      user: true,
      _count: {
        select: {
          favorite_by: true,
          contribute_by: true,
          resource: true,
          comment: true
        }
      },
      cover: true,
      alias: {
        select: {
          name: true
        }
      },
      favorite_by: {
        where: {
          user_id: uid
        }
      }
    }
  })

  if (!patch) {
    return '未找到对应补丁'
  }

  const response: PatchHeader = {
    id: patch.id,
    vndbId: patch.vndb_id,
    name: {
      'zh-cn': patch.name_zh_cn,
      'ja-jp': patch.name_ja_jp,
      'en-us': patch.name_en_us
    },
    introductionMarkdown: {
      'zh-cn': patch.introduction_zh_cn,
      'ja-jp': patch.introduction_ja_jp,
      'en-us': patch.introduction_en_us
    },
    banner: patch.banner,
    status: patch.status,
    view: patch.view,
    download: patch.download,
    type: patch.type,
    language: patch.language,
    platform: patch.platform,
    alias: patch.alias.map((a) => a.name),
    isFavorite: patch.favorite_by.length > 0,
    resourceUpdateTime: patch.resource_update_time,
    content_limit: patch.content_limit,
    cover: patch.cover,
    released: patch.released,
    user: {
      id: patch.user.id,
      name: patch.user.name,
      avatar: patch.user.avatar
    },
    created: String(patch.created),
    updated: String(patch.updated),
    _count: patch._count
  }

  return response
}
