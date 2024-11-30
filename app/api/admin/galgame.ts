import { adminProcedure } from '~/lib/trpc'
import { prisma } from '~/prisma/index'
import { adminPaginationSchema } from '~/validations/admin'
import type { AdminGalgame } from '~/types/api/admin'

export const getGalgame = adminProcedure
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
  })
