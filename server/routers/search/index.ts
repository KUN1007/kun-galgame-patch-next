import { router, publicProcedure } from '~/lib/trpc'
import { prisma } from '~/prisma/index'
import { searchSchema } from '~/validations/search'

export const searchRouter = router({
  searchPatch: publicProcedure
    .input(searchSchema)
    .mutation(async ({ ctx, input }) => {
      const { query, page, limit } = input

      const offset = (page - 1) * limit

      const patches = await Promise.all(
        query.map(async (q) =>
          prisma.patch.findMany({
            where: {
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { vndb_id: { contains: q, mode: 'insensitive' } },
                { introduction: { contains: q, mode: 'insensitive' } },
                { alias: { has: q } }
              ]
            },
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
            },
            take: limit,
            skip: offset,
            orderBy: { updated: 'desc' }
          })
        )
      )

      const flatPatches: GalgameCard[] = patches.flat()

      const total = await prisma.patch.count({
        where: {
          OR: query.map((q) => ({
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { vndb_id: { contains: q, mode: 'insensitive' } },
              { introduction: { contains: q, mode: 'insensitive' } },
              { alias: { hasSome: [q] } }
            ]
          }))
        }
      })

      return { patches: flatPatches, total }
    })
})
