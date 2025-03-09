import { z } from 'zod'
import { prisma } from '~/prisma/index'
import { markdownToHtml } from '~/app/api/utils/markdownToHtml'
import type { PatchResourceHtml } from '~/types/api/patch'

const patchIdSchema = z.object({
  patchId: z.coerce.number().min(1).max(9999999)
})

export const getPatchResource = async (
  input: z.infer<typeof patchIdSchema>,
  uid: number
) => {
  const { patchId } = input

  const data = await prisma.patch_resource.findMany({
    where: { patch_id: patchId },
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
      }
    }
  })

  const resources: PatchResourceHtml[] = await Promise.all(
    data.map(async (resource) => ({
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
      status: resource.status,
      userId: resource.user_id,
      patchId: resource.patch_id,
      created: String(resource.created),
      user: {
        id: resource.user.id,
        name: resource.user.name,
        avatar: resource.user.avatar,
        patchCount: resource.user._count.patch_resource
      }
    }))
  )

  return resources
}
