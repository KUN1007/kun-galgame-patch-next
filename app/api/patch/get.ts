import { z } from 'zod'
import { prisma } from '~/prisma/index'
import type { Patch } from '~/types/api/patch'

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

  await prisma.patch.update({
    where: { id: patch.id },
    data: { view: { increment: 1 } }
  })

  const response: Patch = {
    id: patch.id,
    vndbId: patch.vndb_id,
    name: patch.name,
    introduction: patch.introduction,
    banner: patch.banner,
    status: patch.status,
    view: patch.view,
    download: patch.download,
    type: patch.type,
    language: patch.language,
    platform: patch.platform,
    alias: patch.alias.map((a) => a.name),
    isFavorite: patch.favorite_by.length > 0,
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
