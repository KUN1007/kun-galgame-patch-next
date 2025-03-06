import { z } from 'zod'
import { prisma } from '~/prisma/index'
import { adminPaginationSchema } from '~/validations/admin'
import type { AdminUser } from '~/types/api/admin'

export const getUserInfo = async (
  input: z.infer<typeof adminPaginationSchema>
) => {
  const { page, limit, search } = input
  const offset = (page - 1) * limit

  const where = search
    ? {
        name: {
          contains: search,
          mode: 'insensitive' as const
        }
      }
    : {}

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { created: 'desc' },
      include: {
        _count: {
          select: {
            patch_resource: true,
            patch: true
          }
        }
      }
    }),
    prisma.user.count({ where })
  ])

  const users: AdminUser[] = data.map((user) => ({
    id: user.id,
    name: user.name,
    bio: user.bio,
    avatar: user.avatar,
    role: user.role,
    created: user.created,
    status: user.status,
    dailyImageCount: user.daily_image_count,
    _count: user._count
  }))

  return { users, total }
}
