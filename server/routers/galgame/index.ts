import { router, publicProcedure } from '~/lib/trpc'
import { prisma } from '~/prisma/index'
import { galgameSchema } from '~/validations/galgame'

export const galgameRouter = router({
  getGalgame: publicProcedure
    .input(galgameSchema)
    .mutation(async ({ ctx, input }) => {
      const { selectedTypes, sortField, sortOrder, page, limit } = input

      const offset = (page - 1) * limit

      const isSelectAll =
        !selectedTypes.length || selectedTypes.includes('全部类型')
      const typeQuery = isSelectAll
        ? {}
        : {
            type: {
              hasSome: selectedTypes
            }
          }

      const data: GalgameCard[] = await prisma.patch.findMany({
        take: limit,
        skip: offset,
        orderBy: { [sortField]: sortOrder },
        where: typeQuery,
        select: {
          id: true,
          name: true,
          banner: true,
          view: true,
          type: true,
          language: true,
          platform: true,
          created: true,
          _count: {
            select: {
              favorite_by: true,
              contribute_by: true,
              resource: true,
              comment: true
            }
          }
        }
      })

      const total = await prisma.patch.count({
        where: typeQuery
      })

      return { data, total }
    })
})
