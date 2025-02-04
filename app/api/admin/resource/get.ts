import { z } from 'zod'
import { prisma } from '~/prisma/index'
import { adminPaginationSchema } from '~/validations/admin'
import type { AdminResource } from '~/types/api/admin'

export const getPatchResource = async (
  input: z.infer<typeof adminPaginationSchema>
) => {
  const { page, limit } = input
  const offset = (page - 1) * limit

  const [data, total] = await Promise.all([
    prisma.patch_resource.findMany({
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
    prisma.patch_resource.count()
  ])

  const resources: AdminResource[] = data.map((resource) => ({
    id: resource.id,
    patchName: resource.patch.name,
    storage: resource.storage,
    size: resource.size,
    type: resource.type,
    language: resource.language,
    note: resource.note,
    hash: resource.hash,
    content: resource.content,
    code: resource.code,
    password: resource.password,
    platform: resource.platform,
    likeCount: 0,
    isLike: false,
    status: resource.status,
    userId: resource.user_id,
    patchId: resource.patch_id,
    created: String(resource.created),
    user: {
      id: resource.user.id,
      name: resource.user.name,
      avatar: resource.user.avatar,
      patchCount: 0
    }
  }))

  return { resources, total }
}
