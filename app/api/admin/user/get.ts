import { z } from 'zod'
import { prisma } from '~/prisma/index'
import { adminPaginationSchema } from '~/validations/admin'
import type { AdminUser } from '~/types/api/admin'

export const getUserInfo = async (
  input: z.infer<typeof adminPaginationSchema>
) => {
  const { page, limit } = input
  const offset = (page - 1) * limit

  const [data, total] = await Promise.all([
    await prisma.user.findMany({
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
    await prisma.user.count()
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
