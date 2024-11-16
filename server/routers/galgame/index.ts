import { router, publicProcedure } from '~/lib/trpc'
import { prisma } from '~/prisma/index'
import { galgameSchema } from '~/validations/galgame'

export const galgameRouter = router({
  getGalgame: publicProcedure
    .input(galgameSchema)
    .mutation(async ({ ctx, input }) => {
      const { sort, page, limit } = input

      const offset = (page - 1) * limit

      const data: GalgameCard[] = await prisma.patch.findMany({
        take: limit,
        skip: offset,
        orderBy: { [sort]: 'desc' },
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

      return data
    })
})
