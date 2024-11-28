import { router, adminProcedure } from '~/lib/trpc'
import { prisma } from '~/prisma/index'
import { adminPaginationSchema } from '~/validations/admin'
import type { AdminUser, AdminGalgame, AdminResource } from '~/types/api/admin'

export const adminRouter = router({
  getUserInfo: adminProcedure
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
        avatar: user.avatar,
        role: user.role,
        created: user.created,
        status: user.status,
        _count: user._count
      }))

      return { users, total }
    }),

  getGalgame: adminProcedure
    .input(adminPaginationSchema)
    .query(async ({ ctx, input }) => {
      const { page, limit } = input
      const offset = (page - 1) * limit

      const [data, total] = await Promise.all([
        await prisma.patch.findMany({
          take: limit,
          skip: offset,
          orderBy: { created: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true
              }
            }
          }
        }),
        await prisma.patch.count()
      ])

      const galgames: AdminGalgame[] = data.map((galgame) => ({
        id: galgame.id,
        name: galgame.name,
        banner: galgame.banner,
        user: galgame.user,
        created: galgame.created
      }))

      return { galgames, total }
    }),

  getPatchResource: adminProcedure
    .input(adminPaginationSchema)
    .query(async ({ ctx, input }) => {
      const { page, limit } = input
      const offset = (page - 1) * limit

      const [data, total] = await Promise.all([
        await prisma.patch_resource.findMany({
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
        await prisma.patch_resource.count()
      ])

      const resources: AdminResource[] = data.map((resource) => ({
        id: resource.id,
        patchId: resource.patch_id,
        patchName: resource.patch.name,
        storage: resource.storage,
        user: resource.user,
        size: resource.size,
        created: resource.created
      }))

      return { resources, total }
    })
})
