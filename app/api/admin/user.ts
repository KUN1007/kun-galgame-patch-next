import { adminProcedure } from '~/lib/trpc'
import { prisma } from '~/prisma/index'
import {
  adminPaginationSchema,
  adminUpdateUserSchema
} from '~/validations/admin'
import type { AdminUser } from '~/types/api/admin'

export const getUserInfo = adminProcedure
  .input(adminPaginationSchema)
  .query(async ({ ctx, input }) => {
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
  })

export const updateUser = adminProcedure
  .input(adminUpdateUserSchema)
  .mutation(async ({ ctx, input }) => {
    const { uid, dailyImageCount, ...rest } = input

    if (rest.role >= 3) {
      const user = await prisma.user.findUnique({
        where: { id: ctx.uid }
      })
      if (!user) {
        return '用户未找到'
      }
      if (user.role < 4) {
        return '设置用户为管理员仅限超级管理员可用'
      }
    }

    await prisma.user.update({
      where: { id: uid },
      data: {
        daily_image_count: dailyImageCount,
        ...rest
      }
    })
  })
