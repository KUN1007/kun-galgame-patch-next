import { z } from 'zod'
import { prisma } from '~/prisma/index'
import { adminPaginationSchema } from '~/validations/admin'
import { markdownToHtml } from '~/app/api/utils/markdownToHtml'
import type { AdminResource } from '~/types/api/admin'

export const getPatchResource = async (
  input: z.infer<typeof adminPaginationSchema>
) => {
  const { page, limit, search } = input
  const offset = (page - 1) * limit

  const where = search
    ? {
        content: {
          contains: search,
          mode: 'insensitive' as const
        }
      }
    : {}

  const [data, total] = await Promise.all([
    prisma.patch_resource.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { created: 'desc' },
      include: {
        patch: {
          select: {
            name: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    }),
    prisma.patch_resource.count({ where })
  ])

  const resources: AdminResource[] = await Promise.all(
    data.map(async (resource) => ({
      id: resource.id,
      name: resource.name,
      modelName: resource.model_name,
      patchName: resource.patch.name,
      storage: resource.storage,
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
      likeCount: 0,
      download: resource.download,
      isLike: false,
      status: resource.status,
      userId: resource.user_id,
      patchId: resource.patch_id,
      created: String(resource.created),
      updateTime: resource.update_time,
      user: {
        id: resource.user.id,
        name: resource.user.name,
        avatar: resource.user.avatar,
        patchCount: 0
      }
    }))
  )

  return { resources, total }
}
